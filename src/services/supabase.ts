// ============================================================================
// BusTracker: Supabase Client (React Native / Expo)
// ONLY uses anon key — service_role key NEVER touches the client
// All security enforced by RLS + server-side functions
// ============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ── These are PUBLIC keys — safe to include in client code ──
// RLS ensures data access is restricted per-user
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzEzNDEsImV4cCI6MjEwMTg0NzM0MX0.9ETxdL2W8O09B0-z5Jq09dDU1JblgdT0YUUGGdXaU3Y";

// ── Create Supabase client with persistent auth ──
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export base URL for direct API calls
export { SUPABASE_URL, SUPABASE_ANON_KEY };

// ════════════════════════════════════════════════════════════════
// AUTH-AWARE API CALL HELPER
// Automatically injects JWT access_token as Bearer token
// + HMAC-SHA256 app signature for production verification
// Use this for direct fetch() calls to Edge Functions or external APIs
// ════════════════════════════════════════════════════════════════

// App signing secret — must match APP_SIGNING_SECRET in Edge Function env
// Set this via EXPO_PUBLIC_APP_SIGNING_SECRET in .env
const APP_SIGNING_SECRET = process.env.EXPO_PUBLIC_APP_SIGNING_SECRET || "";

/** Compute HMAC-SHA256 signature for request body */
async function computeHmac(body: string): Promise<string> {
  if (!APP_SIGNING_SECRET) return "";
  try {
    // Use crypto.subtle (available in React Native Hermes)
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(APP_SIGNING_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
}

/**
 * Build authenticated headers with JWT Bearer token
 * Supabase client auto-attaches tokens for .from() / .rpc() / .functions.invoke()
 * but if you need raw fetch(), use this helper
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    "x-client-info": `bustracker-${Platform.OS}`,
    "x-app-version": "1.0.0",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Make an authenticated API call to any endpoint
 * Automatically injects JWT access_token, Content-Type, apikey,
 * and HMAC-SHA256 app signature for production verification
 */
export async function apiCall<T = any>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: Record<string, any>
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const headers = await getAuthHeaders();
    const url = path.startsWith("http") ? path : `${SUPABASE_URL}${path}`;

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      const bodyStr = JSON.stringify(body);
      options.body = bodyStr;

      // Sign the request body with HMAC-SHA256
      const signature = await computeHmac(bodyStr);
      if (signature) {
        (options.headers as Record<string, string>)["x-app-signature"] = signature;
      }
    }

    const response = await fetch(url, options);
    const responseData = await response.json().catch(() => null);

    return {
      data: responseData as T,
      error: response.ok ? null : (responseData?.message || responseData?.error || `HTTP ${response.status}`),
      status: response.status,
    };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error", status: 0 };
  }
}

/**
 * Invoke a Supabase Edge Function with proper auth headers and typed payload
 * Wrapper around supabase.functions.invoke() with better error handling
 *
 * @example
 * const result = await invokeEdgeFunction("register-user", {
 *   action: "check_authorization",
 *   phone: "+919876543210",
 *   contact_type: "parent",
 * });
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  payload: Record<string, any>,
  options?: { method?: string }
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      method: (options?.method || "POST") as "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
    });

    if (error) {
      console.warn(`Edge Function [${functionName}] error:`, error);
      return { success: false, error: error.message || "Edge function error" };
    }

    return { success: true, data: data as T };
  } catch (err: any) {
    console.error(`Edge Function [${functionName}] exception:`, err);
    return { success: false, error: err.message || "Network error" };
  }
}


// ════════════════════════════════════════════════════════════════
// AUTH HELPERS (Phone OTP via Supabase Auth)
// ════════════════════════════════════════════════════════════════

/**
 * Send OTP to phone number
 * Supabase Auth handles rate limiting & delivery
 */
export async function sendPhoneOtp(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

/**
 * Verify OTP code
 * On success: auth.uid() is set, JWT issued
 */
export async function verifyPhoneOtp(phone: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: "sms",
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { success: !error, error: error?.message };
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return data?.session || null;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return data?.user || null;
}


// ════════════════════════════════════════════════════════════════
// REGISTRATION (delegates to server-side Edge Function)
// Client sends phone + name → server validates authorized_contacts
// ════════════════════════════════════════════════════════════════

/**
 * Check if phone is authorized or available BEFORE sending OTP
 */
export async function checkPhoneAuthorization(phone: string, contactType: "parent" | "driver" | "school") {
  const { data, error } = await supabase.functions.invoke("register-user", {
    body: {
      action: "check_authorization",
      phone,
      full_name: "",
      contact_type: contactType,
    },
  });

  if (error) return { success: false, error: error.message || "Network error." };
  if (!data) return { success: false, error: "No response from server" };

  const errObj = data.error;
  const errorCode = typeof errObj === "object" ? errObj?.code : data.code;
  const errorMessage = typeof errObj === "object" ? (errObj?.message || "Phone not authorized") : (typeof errObj === "string" ? errObj : data.message || "Phone not authorized");

  return {
    success: !!data.success,
    authorized: !!data.authorized,
    code: errorCode,
    error: errorMessage,
    school_name: data.data?.school_name || data.school_name,
  };
}

/**
 * Register parent (server validates authorized_contacts + creates trial + auth user)
 */
export async function registerParent(
  phone: string,
  fullName: string,
  password?: string,
  relation?: string,
  email?: string,
  address?: string
) {
  const cleanDigits = phone.replace(/\D/g, "");
  const raw10 = cleanDigits.slice(-10);
  const formatted = phone.startsWith("+") ? phone : `+91${raw10}`;

  const { data, error } = await supabase.functions.invoke("register-user", {
    body: {
      action: "register_parent",
      phone: formatted,
      full_name: fullName,
      password: password || "Kumar@123",
      relation: relation || "guardian",
      email: email || undefined,
      address: address || undefined,
    },
  });

  if (error) return { success: false, error: error.message || "Registration failed." };
  return data;
}

/**
 * Register driver (server validates authorized_contacts + creates driver account)
 */
export async function registerDriver(
  phone: string,
  fullName: string,
  password?: string,
  licenseNumber?: string,
  licenseExpiry?: string,
  experienceYears?: number,
  busNumber?: string
) {
  const cleanDigits = phone.replace(/\D/g, "");
  const raw10 = cleanDigits.slice(-10);
  const formatted = phone.startsWith("+") ? phone : `+91${raw10}`;

  const { data, error } = await supabase.functions.invoke("register-user", {
    body: {
      action: "register_driver",
      phone: formatted,
      full_name: fullName,
      password: password || "Kumar@123",
      license_number: licenseNumber,
      license_expiry: licenseExpiry,
      experience_years: experienceYears,
      bus_number: busNumber,
    },
  });

  if (error) return { success: false, error: error.message || "Registration failed." };
  return data;
}

/**
 * Register school (inserts school with status 'pending' and creates school admin)
 */
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
}) {
  const { data, error } = await supabase.functions.invoke("register-user", {
    body: {
      action: "register_school",
      ...schoolData,
    },
  });

  if (error) return { success: false, error: error.message || "School registration request failed." };
  return data;
}


// ════════════════════════════════════════════════════════════════
// DASHBOARD DATA (via server-side DB functions)
// ════════════════════════════════════════════════════════════════

export async function getParentDashboard() {
  const { data, error } = await supabase.rpc("get_parent_dashboard");
  if (error) return null;
  return data;
}

export async function getDriverDashboard() {
  const { data, error } = await supabase.rpc("get_driver_dashboard");
  if (error) return null;
  return data;
}

export async function getSchoolDashboard(schoolId: string) {
  const { data, error } = await supabase.rpc("get_school_dashboard", { p_school_id: schoolId });
  if (error) return null;
  return data;
}

export async function getSubscriptionStatus() {
  const { data, error } = await supabase.rpc("get_subscription_status");
  if (error) return null;
  return data;
}


// ════════════════════════════════════════════════════════════════
// LIVE TRACKING (via server-side DB functions + Supabase Realtime)
// ════════════════════════════════════════════════════════════════

/**
 * Driver: Update bus location (server validates driver owns bus)
 */
export async function updateBusLocation(
  busId: string,
  latitude: number,
  longitude: number,
  speed: number = 0,
  heading: number = 0,
  accuracy: number = 0
) {
  const { data, error } = await supabase.rpc("update_bus_location", {
    p_bus_id: busId,
    p_lat: latitude,
    p_lng: longitude,
    p_speed: speed,
    p_heading: heading,
    p_accuracy: accuracy,
  });

  if (error) return { success: false, error: error.message };
  return data;
}

/**
 * Driver: Stop broadcasting location
 */
export async function stopBusLocation(busId: string) {
  const { data, error } = await supabase.rpc("stop_bus_location", { p_bus_id: busId });
  if (error) return { success: false, error: error.message };
  return data;
}

/**
 * Driver: Start trip (server validates everything)
 */
export async function startTrip(tripType: "pickup" | "drop") {
  const { data, error } = await supabase.rpc("start_trip", { p_trip_type: tripType });
  if (error) return { success: false, error: error.message };
  return data;
}

/**
 * Driver: Stop trip
 */
export async function stopTrip(tripId: string) {
  const { data, error } = await supabase.rpc("stop_trip", { p_trip_id: tripId });
  if (error) return { success: false, error: error.message };
  return data;
}

/**
 * Parent: Subscribe to real-time bus location updates
 * RLS ensures parent only sees their child's bus
 */
export function subscribeToBusLocation(
  busId: string,
  onUpdate: (location: { latitude: number; longitude: number; speed: number; heading: number; is_live: boolean; updated_at: string }) => void
) {
  const channel = supabase
    .channel(`bus-location-${busId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bus_live_locations",
        filter: `bus_id=eq.${busId}`,
      },
      (payload) => {
        onUpdate(payload.new as any);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}


// ════════════════════════════════════════════════════════════════
// PUSH TOKEN REGISTRATION
// ════════════════════════════════════════════════════════════════

/**
 * Register push token (user can have multiple devices)
 */
export async function registerPushToken(
  token: string,
  platform: "android" | "ios" | "web",
  deviceId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform,
      device_id: deviceId || null,
      is_active: true,
    },
    { onConflict: "user_id,token" }
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}


// ════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════════

/**
 * Get user's notifications
 */
export async function getNotifications(limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  return !error;
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  onNewNotification: (notification: any) => void
) {
  const channel = supabase
    .channel("user-notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      },
      (payload) => {
        onNewNotification(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}


// ════════════════════════════════════════════════════════════════
// GOOGLE PLAY PAYMENT (send purchase token to server for verification)
// ════════════════════════════════════════════════════════════════

/**
 * Verify Google Play purchase (server-side verification)
 * NEVER trust "payment successful" on client — server verifies with Google API
 */
export async function verifyGooglePlayPurchase(
  purchaseToken: string,
  productId: string,
  orderId?: string
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data, error } = await supabase.functions.invoke("google-play-webhook", {
    body: {
      action: "verify-purchase",
      user_id: user.id,
      purchase_token: purchaseToken,
      product_id: productId,
      order_id: orderId,
    },
  });

  if (error) return { success: false, error: "Payment verification failed." };
  return data;
}
