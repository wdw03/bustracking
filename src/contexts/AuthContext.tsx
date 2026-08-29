// ============================================================================
// BusTracker: Global Auth + Subscription Context
// Wraps entire app — provides user, profile, subscription state
// Persists JWT tokens, session, profile JSON locally
// Talks to Supabase for real authentication (never trusts client alone)
// ============================================================================

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  supabase,
  getCurrentUser,
  getSession,
  signOut,
  getSubscriptionStatus,
  sendPhoneOtp,
  verifyPhoneOtp,
  registerParent,
  registerDriver,
  checkPhoneAuthorization,
} from "../services/supabase";
import {
  saveSession,
  saveProfile as cacheProfile,
  saveSubscription as cacheSubscription,
  getCachedProfile,
  getCachedSubscription,
  clearSession,
  getAccessToken,
  getSessionInfo,
  getDeviceId,
  isTokenExpired,
} from "../services/sessionManager";
import type { Session, User } from "@supabase/supabase-js";

// ── Types ──

export type UserRole = "super_admin" | "school_admin" | "parent" | "driver" | null;

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  is_active?: boolean;
  school_id?: string;
  driver_id?: string;
  assigned_bus_id?: string;
  created_at?: string;
};

export type SubscriptionInfo = {
  status: "trial" | "active" | "expired" | "none";
  trial_days_left: number;
  plan_name: string | null;
  can_track: boolean;
  expires_at: string | null;
};

type AuthContextType = {
  // ── Auth State ──
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: SubscriptionInfo;
  isLoading: boolean;       // initial session check
  isAuthenticated: boolean;

  // ── JWT / Token Access ──
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;

  // ── Auth Actions ──
  login: (phone: string, secret: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // ── Registration ──
  checkAuthorization: (phone: string, contactType: "parent" | "driver" | "school") => Promise<{ success: boolean; authorized?: boolean; code?: string; school_name?: string; error?: string }>;
  completeRegistration: (action: "register_parent" | "register_driver", phone: string, fullName: string, extras?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;

  // ── Subscription ──
  refreshSubscription: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // ── Session Debug Info ──
  getSessionDebugInfo: () => Promise<Record<string, any>>;
};

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  status: "none",
  trial_days_left: 0,
  plan_name: null,
  can_track: false,
  expires_at: null,
};

const AuthContext = createContext<AuthContextType | null>(null);

// ── Helper: Fetch profile from profiles table + cache locally ──
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, avatar_url, is_active, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const profile = data as Profile;

  // Resolve school_id from school_members table
  const { data: memberData } = await supabase
    .from("school_members")
    .select("school_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (memberData) {
    profile.school_id = memberData.school_id;
  } else {
    // Also check schools table directly where admin_user_id = userId
    const { data: schoolData } = await supabase
      .from("schools")
      .select("id")
      .eq("admin_user_id", userId)
      .limit(1)
      .maybeSingle();
    if (schoolData) {
      profile.school_id = schoolData.id;
    }
  }

  // For drivers, also resolve driver_id and assigned_bus_id
  if (profile.role === "driver") {
    const { data: driverData } = await supabase
      .from("drivers")
      .select("id, assigned_bus_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (driverData) {
      profile.driver_id = driverData.id;
      profile.assigned_bus_id = driverData.assigned_bus_id;
    }
  }

  // Cache profile JSON locally for instant display on next launch
  await cacheProfile(profile as any);

  return profile;
}

// ── Helper: Fetch subscription status + cache locally ──
async function fetchSubscription(): Promise<SubscriptionInfo> {
  const data = await getSubscriptionStatus();
  if (!data) return DEFAULT_SUBSCRIPTION;

  const sub: SubscriptionInfo = {
    status: data.status || "none",
    trial_days_left: data.trial_days_left || 0,
    plan_name: data.plan_name || null,
    can_track: data.can_track || false,
    expires_at: data.expires_at || null,
  };

  // Cache subscription locally
  await cacheSubscription(sub);

  return sub;
}

// ════════════════════════════════════════════════════════════════
// AUTH PROVIDER
// ════════════════════════════════════════════════════════════════

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(DEFAULT_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState(true);

  // ── Exposed JWT token state ──
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);

  // ── Persist session tokens to local storage ──
  const persistSession = useCallback(async (sess: Session) => {
    setAccessToken(sess.access_token);
    setRefreshToken(sess.refresh_token);
    setTokenExpiresAt(
      sess.expires_at
        ? new Date(sess.expires_at * 1000).toISOString()
        : null
    );

    // Save full session + individual tokens to AsyncStorage/localStorage
    await saveSession({
      access_token: sess.access_token,
      refresh_token: sess.refresh_token,
      expires_at: sess.expires_at,
      expires_in: sess.expires_in,
      token_type: sess.token_type,
      user: sess.user ? { id: sess.user.id, phone: sess.user.phone } : undefined,
    });
  }, []);

  // ── On mount: check existing session + restore cached data ──
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Step 1: Immediately load cached profile & subscription for instant display
        const [cachedProf, cachedSub] = await Promise.all([
          getCachedProfile(),
          getCachedSubscription(),
        ]);

        if (mounted && cachedProf) {
          setProfile(cachedProf as unknown as Profile);
        }
        if (mounted && cachedSub) {
          setSubscription({
            status: cachedSub.status || "none",
            trial_days_left: cachedSub.trial_days_left || 0,
            plan_name: cachedSub.plan_name || null,
            can_track: cachedSub.can_track || false,
            expires_at: cachedSub.expires_at || null,
          });
        }

        // Step 2: Check Supabase for active session (validates JWT with server)
        const existingSession = await getSession();
        if (existingSession && mounted) {
          // Fetch fresh profile & subscription from server (replaces cached data)
          const [prof, sub] = await Promise.all([
            fetchProfile(existingSession.user.id),
            fetchSubscription(),
          ]);

          // If school admin is not active or school is pending, do not keep active session
          if (prof?.role === "school_admin" && !prof.is_active) {
            await supabase.auth.signOut();
            await clearSession();
            if (mounted) {
              setProfile(null);
              setSession(null);
              setUser(null);
            }
            return;
          }

          setSession(existingSession);
          setUser(existingSession.user);
          await persistSession(existingSession);

          if (mounted) {
            setProfile(prof);
            setSubscription(sub);
          }
        } else if (mounted) {
          // No valid session — clear any stale cached data
          setProfile(null);
          setSubscription(DEFAULT_SUBSCRIPTION);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // ── Listen for auth state changes (login/logout/token refresh) ──
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (event === "SIGNED_IN" && newSession) {
          const [prof, sub] = await Promise.all([
            fetchProfile(newSession.user.id),
            fetchSubscription(),
          ]);

          // Block unapproved school admin from acquiring active session via auto-sign-in
          if (prof?.role === "school_admin" && !prof.is_active) {
            await supabase.auth.signOut();
            await clearSession();
            if (mounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setSubscription(DEFAULT_SUBSCRIPTION);
            }
            return;
          }

          setSession(newSession);
          setUser(newSession.user);
          await persistSession(newSession);

          if (mounted) {
            setProfile(prof);
            setSubscription(sub);
          }
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setProfile(null);
          setSubscription(DEFAULT_SUBSCRIPTION);
          setAccessToken(null);
          setRefreshToken(null);
          setTokenExpiresAt(null);

          // Clear all local storage
          await clearSession();
        } else if (event === "TOKEN_REFRESHED" && newSession) {
          // JWT was auto-refreshed — persist new tokens
          setSession(newSession);
          await persistSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      authSub?.unsubscribe();
    };
  }, [persistSession]);

  // ── Send OTP to phone ──
  const sendOtp = useCallback(async (phone: string) => {
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    const result = await sendPhoneOtp(formattedPhone);
    return result;
  }, []);

  // ── Login: Password or OTP → creates session with Supabase ──
  const login = useCallback(async (phoneOrEmail: string, secret: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    const cleanPhone = phoneOrEmail.replace(/\D/g, "");
    const raw10 = cleanPhone.slice(-10);
    const formattedPhone = cleanPhone ? (phoneOrEmail.startsWith("+") ? phoneOrEmail : `+91${raw10}`) : "";

    const candidates: string[] = [];

    if (phoneOrEmail.includes("@")) {
      candidates.push(phoneOrEmail.trim().toLowerCase());
    } else {
      if (raw10) candidates.push(`${raw10}@bustracker.com`);
      if (cleanPhone && cleanPhone !== raw10) candidates.push(`${cleanPhone}@bustracker.com`);
      if (raw10) candidates.push(`91${raw10}@bustracker.com`);
    }

    let res: any = { error: { message: "Invalid phone or password." } };

    // Step 1: Attempt password login via email mapping (Supabase Auth)
    for (const email of candidates) {
      const emailRes = await supabase.auth.signInWithPassword({
        email,
        password: secret,
      });
      if (!emailRes.error) {
        res = emailRes;
        break;
      }
    }

    // Step 2: If email login failed and it's a phone, try direct phone login
    if (res.error && !phoneOrEmail.includes("@") && formattedPhone) {
      const phonesToTry = [formattedPhone, `91${raw10}`, cleanPhone, raw10].filter(Boolean);
      for (const p of phonesToTry) {
        const phoneRes = await supabase.auth.signInWithPassword({
          phone: p,
          password: secret,
        });
        if (!phoneRes.error) {
          res = phoneRes;
          break;
        }
      }
    }

    // Step 3: If password failed, try OTP verification (if numeric token)
    if (res.error && /^\d{4,6}$/.test(secret.trim()) && formattedPhone) {
      const otpRes = await verifyPhoneOtp(formattedPhone, secret.trim());
      if (otpRes.success) {
        return { success: true };
      }
    }

    if (res.error) {
      return { success: false, error: res.error.message || "Invalid phone or password." };
    }

    if (res.data?.session) {
      const authUser = res.data.user;
      const [prof, sub] = await Promise.all([
        fetchProfile(authUser.id),
        fetchSubscription(),
      ]);

      // If school admin, check if the school has been approved by Super Admin
      if (prof?.role === "school_admin") {
        const cleanUserPhone = (authUser.phone || cleanPhone).replace(/\D/g, "");
        const formattedUserPhone = cleanUserPhone.startsWith("+") ? cleanUserPhone : `+91${cleanUserPhone.slice(-10)}`;
        const raw10 = cleanUserPhone.slice(-10);

        let schoolQuery = supabase.from("schools").select("id, status, name");
        if (prof.school_id) {
          schoolQuery = schoolQuery.eq("id", prof.school_id);
        } else {
          schoolQuery = schoolQuery.or(`admin_user_id.eq.${authUser.id},phone.eq.${formattedUserPhone},phone.eq.${cleanUserPhone},phone.eq.${raw10}`);
        }

        const { data: school } = await schoolQuery.limit(1).maybeSingle();

        if (school && school.status === "pending") {
          await supabase.auth.signOut();
          await clearSession();
          return {
            success: false,
            code: "REGISTRATION_PENDING",
            error: "Your school registration is in process and pending approval by Super Admin. You can log in once approved.",
          };
        }

        if (school && school.status === "rejected") {
          await supabase.auth.signOut();
          await clearSession();
          return {
            success: false,
            code: "REGISTRATION_REJECTED",
            error: "Your school registration request was rejected by Super Admin. Please contact support.",
          };
        }

        if (!prof.is_active && (!school || school.status !== "approved")) {
          await supabase.auth.signOut();
          await clearSession();
          return {
            success: false,
            code: "REGISTRATION_PENDING",
            error: "Your registration is in process and pending approval by Super Admin. You can log in once approved.",
          };
        }
      }

      setSession(res.data.session);
      setUser(authUser);
      await persistSession(res.data.session);
      if (prof) setProfile(prof);
      if (sub) setSubscription(sub);
    }

    return { success: true };
  }, [persistSession, fetchSubscription]);

  // ── Check phone authorization ──
  const checkAuthorization = useCallback(async (phone: string, contactType: "parent" | "driver" | "school") => {
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    const result = await checkPhoneAuthorization(formattedPhone, contactType);

    if (!result || !result.success) {
      const errMessage = typeof result?.error === "string" 
        ? result.error 
        : typeof (result?.error as any)?.message === "string"
        ? (result.error as any).message
        : "Phone not authorized by school";
      const errCode = result?.code || (result?.error as any)?.code;

      return {
        success: false,
        authorized: false,
        code: errCode,
        error: errMessage,
      };
    }

    return {
      success: true,
      authorized: result.authorized,
      code: result.code,
      school_name: result.school_name,
    };
  }, []);

  // ── Complete registration (after OTP verified) ──
  const completeRegistration = useCallback(async (
    action: "register_parent" | "register_driver",
    phone: string,
    fullName: string,
    extras?: Record<string, any>
  ) => {
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    let result;
    if (action === "register_parent") {
      result = await registerParent(formattedPhone, fullName);
    } else {
      result = await registerDriver(
        formattedPhone,
        fullName,
        extras?.license_number,
        extras?.license_expiry,
        extras?.experience_years,
      );
    }

    if (!result || !result.success) {
      return { success: false, error: result?.error || "Registration failed" };
    }

    // Refresh profile & subscription after registration
    await refreshProfile();
    await refreshSubscription();

    return { success: true };
  }, []);

  // ── Logout ──
  const handleLogout = useCallback(async () => {
    await signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(DEFAULT_SUBSCRIPTION);
    setAccessToken(null);
    setRefreshToken(null);
    setTokenExpiresAt(null);

    // Clear all persisted session data
    await clearSession();
  }, []);

  // ── Refresh helpers ──
  const refreshSubscription = useCallback(async () => {
    const sub = await fetchSubscription();
    setSubscription(sub);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const prof = await fetchProfile(user.id);
    setProfile(prof);
  }, [user]);

  // ── Debug info for developer tools / session inspection ──
  const getSessionDebugInfo = useCallback(async () => {
    const info = await getSessionInfo();
    return {
      ...info,
      supabase_session_present: !!session,
      context_user_id: user?.id || null,
      context_role: profile?.role || null,
      context_school_id: profile?.school_id || null,
      context_driver_id: profile?.driver_id || null,
    };
  }, [session, user, profile]);

  // ── Context value ──
  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    profile,
    subscription,
    isLoading,
    isAuthenticated: !!session && !!user,

    // JWT tokens exposed
    accessToken,
    refreshToken,
    tokenExpiresAt,

    login,
    sendOtp,
    logout: handleLogout,
    checkAuthorization,
    completeRegistration,
    refreshSubscription,
    refreshProfile,
    getSessionDebugInfo,
  }), [user, session, profile, subscription, isLoading, accessToken, refreshToken, tokenExpiresAt, login, sendOtp, handleLogout, checkAuthorization, completeRegistration, refreshSubscription, refreshProfile, getSessionDebugInfo]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// ── Convenience hooks ──
export function useSubscriptionStatus() {
  const { subscription } = useAuth();
  return subscription;
}

export function useUserProfile() {
  const { profile } = useAuth();
  return profile;
}

// Re-export session utilities for direct use
export { getAccessToken, getDeviceId, isTokenExpired, getSessionInfo };
