// ============================================================================
// BusTracker: Notification Service
// Notification CRUD + Realtime subscription + Push token management
// ============================================================================

import { supabase } from "./supabase";
import type { Notification, ApiResult, PlatformType } from "./types";

// ── Fetch Notifications ──

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Notification[];
}

// ── Unread Count ──

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error || count === null) return 0;
  return count;
}

// ── Mark as Read ──

export async function markNotificationRead(notificationId: string): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Mark all notifications as read */
export async function markAllNotificationsRead(): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Subscribe to Real-time Notifications ──

export function subscribeToNotifications(
  onNewNotification: (notification: Notification) => void
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
        onNewNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Push Token Registration ──

export async function registerPushToken(
  token: string,
  platform: PlatformType,
  deviceId?: string
): Promise<ApiResult<void>> {
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

/** Deactivate push token (on logout) */
export async function deactivatePushToken(token: string): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from("push_tokens")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("token", token);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
