// ============================================================================
// BusTracker: Session Manager
// Persistent session + JWT token + profile caching layer
// Saves access_token, refresh_token, profile JSON, session metadata
// to AsyncStorage (mobile) or localStorage (web)
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ── Storage Keys ──
const STORAGE_KEYS = {
  SESSION: "bustracker_session",
  ACCESS_TOKEN: "bustracker_access_token",
  REFRESH_TOKEN: "bustracker_refresh_token",
  PROFILE: "bustracker_profile",
  SUBSCRIPTION: "bustracker_subscription",
  DEVICE_ID: "bustracker_device_id",
  LAST_LOGIN: "bustracker_last_login",
  TOKEN_EXPIRES_AT: "bustracker_token_expires_at",
} as const;

// ── Types ──
export type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;   // unix timestamp (seconds)
  expires_in: number;   // seconds from issue
  token_type: string;   // "bearer"
  user_id: string;
  phone?: string;
  role?: string;
};

export type StoredProfile = {
  id: string;
  full_name: string;
  phone: string;
  role: string | null;
  avatar_url?: string;
  school_id?: string;
  driver_id?: string;
  assigned_bus_id?: string;
  created_at?: string;
  cached_at: string;    // ISO string — when this was cached
};

// ════════════════════════════════════════════════════════════════
// STORAGE HELPERS (cross-platform: AsyncStorage on mobile, localStorage on web)
// ════════════════════════════════════════════════════════════════

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); } catch { /* quota */ }
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try { return localStorage.getItem(key); } catch { return null; }
  } else {
    return AsyncStorage.getItem(key);
  }
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  } else {
    await AsyncStorage.removeItem(key);
  }
}

async function multiRemove(keys: string[]): Promise<void> {
  if (Platform.OS === "web") {
    keys.forEach((k) => { try { localStorage.removeItem(k); } catch { /* noop */ } });
  } else {
    await Promise.all(keys.map((k) => AsyncStorage.removeItem(k)));
  }
}

// ════════════════════════════════════════════════════════════════
// SESSION PERSISTENCE
// ════════════════════════════════════════════════════════════════

/**
 * Save complete session (called after login, token refresh)
 * Stores access_token, refresh_token, expiry, and user metadata
 */
export async function saveSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: { id: string; phone?: string };
}): Promise<void> {
  const storedSession: StoredSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + (session.expires_in || 3600),
    expires_in: session.expires_in || 3600,
    token_type: session.token_type || "bearer",
    user_id: session.user?.id || "",
    phone: session.user?.phone,
  };

  await Promise.all([
    setItem(STORAGE_KEYS.SESSION, JSON.stringify(storedSession)),
    setItem(STORAGE_KEYS.ACCESS_TOKEN, session.access_token),
    setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token),
    setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(storedSession.expires_at)),
    setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()),
  ]);
}

/**
 * Get stored session
 */
export async function getStoredSession(): Promise<StoredSession | null> {
  const raw = await getItem(STORAGE_KEYS.SESSION);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

/**
 * Get stored JWT access token
 */
export async function getAccessToken(): Promise<string | null> {
  return getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get stored JWT refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  return getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Check if token is expired or about to expire (within 60s buffer)
 */
export async function isTokenExpired(): Promise<boolean> {
  const expiresAt = await getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  if (!expiresAt) return true;

  const expiryTime = parseInt(expiresAt, 10);
  const now = Math.floor(Date.now() / 1000);

  // Consider expired if less than 60 seconds remain
  return now >= (expiryTime - 60);
}

// ════════════════════════════════════════════════════════════════
// PROFILE CACHING
// ════════════════════════════════════════════════════════════════

/**
 * Save profile JSON to local storage (cached copy for instant display)
 */
export async function saveProfile(profile: Omit<StoredProfile, "cached_at">): Promise<void> {
  const cached: StoredProfile = {
    ...profile,
    cached_at: new Date().toISOString(),
  };
  await setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cached));
}

/**
 * Get cached profile (for instant display before network fetch)
 */
export async function getCachedProfile(): Promise<StoredProfile | null> {
  const raw = await getItem(STORAGE_KEYS.PROFILE);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// SUBSCRIPTION CACHING
// ════════════════════════════════════════════════════════════════

/**
 * Cache subscription status locally
 */
export async function saveSubscription(subscription: Record<string, any>): Promise<void> {
  await setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify({
    ...subscription,
    cached_at: new Date().toISOString(),
  }));
}

/**
 * Get cached subscription status
 */
export async function getCachedSubscription(): Promise<Record<string, any> | null> {
  const raw = await getItem(STORAGE_KEYS.SUBSCRIPTION);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// DEVICE ID (persistent across sessions for push token registration)
// ════════════════════════════════════════════════════════════════

/**
 * Get or generate a persistent device ID
 */
export async function getDeviceId(): Promise<string> {
  let deviceId = await getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    await setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

// ════════════════════════════════════════════════════════════════
// CLEAR ALL (on logout)
// ════════════════════════════════════════════════════════════════

/**
 * Clear all stored session data (called on logout)
 * Preserves device_id for push token continuity
 */
export async function clearSession(): Promise<void> {
  await multiRemove([
    STORAGE_KEYS.SESSION,
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.PROFILE,
    STORAGE_KEYS.SUBSCRIPTION,
    STORAGE_KEYS.LAST_LOGIN,
    STORAGE_KEYS.TOKEN_EXPIRES_AT,
    // NOTE: DEVICE_ID is intentionally NOT cleared
  ]);
}

// ════════════════════════════════════════════════════════════════
// AUTH HEADER BUILDER
// ════════════════════════════════════════════════════════════════

/**
 * Build Authorization header with JWT Bearer token
 * Use this when making direct fetch() calls to Edge Functions or external APIs
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (!token) return {};

  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-client-info": `bustracker-${Platform.OS}`,
  };
}

/**
 * Get full session info for debugging / display purposes
 */
export async function getSessionInfo(): Promise<{
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  profile: StoredProfile | null;
  lastLogin: string | null;
  deviceId: string;
}> {
  const [accessToken, refreshToken, expiresAt, profile, lastLogin, deviceId, expired] =
    await Promise.all([
      getAccessToken(),
      getRefreshToken(),
      getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT),
      getCachedProfile(),
      getItem(STORAGE_KEYS.LAST_LOGIN),
      getDeviceId(),
      isTokenExpired(),
    ]);

  return {
    isLoggedIn: !!accessToken && !expired,
    accessToken,
    refreshToken,
    expiresAt: expiresAt ? new Date(parseInt(expiresAt, 10) * 1000).toISOString() : null,
    isExpired: expired,
    profile,
    lastLogin,
    deviceId,
  };
}

// Export storage keys for advanced usage
export { STORAGE_KEYS };
