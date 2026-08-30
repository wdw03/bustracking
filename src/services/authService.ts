// ============================================================================
// BusTracker: Auth Service
// Handles OTP login, registration (via Edge Functions), session management
// All auth goes through Supabase — NEVER trust client-side auth state
// All Edge Function calls use JWT Bearer token automatically
// ============================================================================

import { supabase, invokeEdgeFunction, getAuthHeaders, apiCall } from "./supabase";
import { saveSession, saveProfile, clearSession, getAccessToken } from "./sessionManager";
import type { ApiResult, Profile } from "./types";

// ── OTP Login Flow ──

/** Send OTP to phone (Supabase Auth handles rate limiting & delivery) */
export async function sendOtp(phone: string): Promise<ApiResult<void>> {
  const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
  const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Password login (used for super_admin accounts that have a password set) */
export async function signInWithPassword(phone: string, password: string): Promise<ApiResult<{
  access_token?: string;
  refresh_token?: string;
  user_id?: string;
}>> {
  const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: formatted,
    password,
  });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user_id: data.user?.id,
    },
  };
}

/** Verify OTP → creates session with JWT. Auth state listener persists tokens */
export async function verifyOtp(phone: string, otp: string): Promise<ApiResult<{
  access_token?: string;
  refresh_token?: string;
  user_id?: string;
}>> {
  const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formatted,
    token: otp,
    type: "sms",
  });

  if (error) return { success: false, error: error.message };

  // Session is auto-persisted by AuthContext listener, but return tokens for caller
  return {
    success: true,
    data: {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user_id: data.user?.id,
    },
  };
}

// ── Session Management ──

export async function signOut(): Promise<ApiResult<void>> {
  const { error } = await supabase.auth.signOut();
  // Clear all local tokens and cached data
  await clearSession();
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

/**
 * Get full session details including JWT tokens
 * Returns: { access_token, refresh_token, expires_at, user }
 */
export async function getFullSession() {
  const { data } = await supabase.auth.getSession();
  if (!data?.session) return null;

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
    user: {
      id: data.session.user.id,
      phone: data.session.user.phone,
      role: data.session.user.role,
      created_at: data.session.user.created_at,
    },
  };
}

// ── Profile Fetch + Local Cache ──

/** Fetch user profile from profiles table (returns full JSON) */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, phone, full_name, role, avatar_url, is_active, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const profile = data as Profile;

  // Cache profile JSON locally for instant display on next app launch
  await saveProfile(profile as any);

  return profile;
}

/** Get school_id for current user (from school_members table) */
export async function getUserSchoolId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("school_members")
    .select("school_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.school_id;
}

// ── Registration (via Edge Functions — server validates authorized_contacts) ──
// All Edge Function calls automatically include JWT Bearer token via supabase.functions.invoke()

/** Check if phone is authorized or available BEFORE sending OTP */
export async function checkPhoneAuthorization(
  phone: string,
  contactType: "parent" | "driver" | "school"
): Promise<{ success: boolean; authorized?: boolean; code?: string; school_name?: string; error?: string }> {
  const formatted = phone.startsWith("+") ? phone : `+91${phone}`;

  const result = await invokeEdgeFunction<{
    success: boolean;
    authorized?: boolean;
    data?: { school_name?: string };
    error?: { code?: string; message?: string } | string;
  }>("register-user", {
    action: "check_authorization",
    phone: formatted,
    full_name: "",
    contact_type: contactType,
  });

  if (!result.success || !result.data?.success) {
    const errObj = result.data?.error;
    const errorCode = typeof errObj === "object" ? errObj?.code : undefined;
    const errorMessage = typeof errObj === "object"
      ? (errObj?.message || "Phone not authorized")
      : (typeof errObj === "string" ? errObj : (typeof result.error === "string" ? result.error : "Phone not authorized"));

    return {
      success: false,
      authorized: false,
      code: errorCode || (typeof result.error === "string" && result.error.includes("already registered") ? "ALREADY_REGISTERED" : undefined),
      error: errorMessage,
    };
  }

  return {
    success: true,
    authorized: true,
    school_name: result.data?.data?.school_name,
  };
}

/** Register parent (server validates authorized_contacts + creates trial + auth user) */
export async function registerParent(phone: string, fullName: string, password?: string, relation?: string): Promise<ApiResult<any>> {
  const cleanDigits = phone.replace(/\D/g, "");
  const raw10 = cleanDigits.slice(-10);
  const formatted = phone.startsWith("+") ? phone : `+91${raw10}`;

  const result = await invokeEdgeFunction("register-user", {
    action: "register_parent",
    phone: formatted,
    full_name: fullName,
    password: password || "Kumar@123",
    relation: relation || "guardian",
  });

  if (!result.success) return { success: false, error: result.error || "Registration failed." };
  return { success: true, data: result.data };
}

/** Register driver (server validates authorized_contacts + creates driver account) */
export async function registerDriver(
  phone: string,
  fullName: string,
  password?: string,
  licenseNumber?: string,
  licenseExpiry?: string,
  experienceYears?: number
): Promise<ApiResult<any>> {
  const cleanDigits = phone.replace(/\D/g, "");
  const raw10 = cleanDigits.slice(-10);
  const formatted = phone.startsWith("+") ? phone : `+91${raw10}`;

  const result = await invokeEdgeFunction("register-user", {
    action: "register_driver",
    phone: formatted,
    full_name: fullName,
    password: password || "Kumar@123",
    license_number: licenseNumber,
    license_expiry: licenseExpiry,
    experience_years: experienceYears,
  });

  if (!result.success) return { success: false, error: result.error || "Registration failed." };
  return { success: true, data: result.data };
}

/** Register school (submits registration to Super Admin for approval) */
export async function registerSchool(schoolData: {
  schoolName: string;
  schoolEmail?: string;
  schoolPhone: string;
  principalName?: string;
  adminName?: string;
  adminMobile?: string;
  adminEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  password?: string;
}): Promise<ApiResult<any>> {
  const result = await invokeEdgeFunction("register-user", {
    action: "register_school",
    ...schoolData,
  });

  if (!result.success) return { success: false, error: result.error || "School registration request failed." };
  return { success: true, data: result.data };
}

/** Reset user password after OTP verification */
export async function resetPassword(phone: string, newPassword: string): Promise<ApiResult<any>> {
  const formatted = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
  const result = await invokeEdgeFunction("register-user", {
    action: "reset_password",
    phone: formatted,
    password: newPassword,
  });

  if (!result.success) {
    // If edge function returned error or wasn't available, try updating via client session
    const { error: clientErr } = await supabase.auth.updateUser({ password: newPassword });
    if (!clientErr) return { success: true };
    return { success: false, error: result.error || clientErr.message || "Failed to reset password." };
  }
  return { success: true, data: result.data };
}

/** Check if phone exists for forgot password */
export async function checkPhoneExists(phone: string): Promise<{ success: boolean; exists?: boolean; name?: string; role?: string; error?: string }> {
  const formatted = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
  const result = await invokeEdgeFunction<{ success: boolean; exists?: boolean; name?: string; role?: string; error?: any }>("register-user", {
    action: "check_phone_exists",
    phone: formatted,
  });

  if (!result.success || !result.data?.success) {
    return { success: false, exists: false, error: result.error || "Phone not found." };
  }
  return { success: true, exists: result.data.exists, name: result.data.name, role: result.data.role };
}

// ── Helper: Get current JWT access token (for external API calls) ──
export { getAccessToken, getAuthHeaders, apiCall };
