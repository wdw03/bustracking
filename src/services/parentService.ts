// ============================================================================
// BusTracker: Parent Service
// Parent-specific operations — children, bus info, dashboard
// Uses get_parent_dashboard() RPC for secure single-call data
// ============================================================================

import { supabase } from "./supabase";
import type { ParentDashboardData, BusLiveLocation, ApiResult } from "./types";

// ── Dashboard (single RPC call — returns all parent data securely) ──

export async function getParentDashboard(): Promise<ParentDashboardData | null> {
  const { data, error } = await supabase.rpc("get_parent_dashboard");
  if (error || !data) {
    console.warn("getParentDashboard error:", error);
    return null;
  }
  return data as ParentDashboardData;
}

// ── Children List (with bus info) ──

export async function getParentChildren() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("child_parents")
    .select(`
      child_id,
      relationship,
      is_primary,
      children:child_id(
        id, full_name, class, section, roll_number,
        pickup_address, assigned_bus_id, photo_url,
        buses:assigned_bus_id(id, bus_number, route_name, capacity),
        schools:school_id(id, name, phone, address)
      )
    `)
    .eq("parent_user_id", user.id);

  if (error || !data) return [];
  return data.map((row: any) => ({
    ...row.children,
    relationship: row.relationship,
    is_primary: row.is_primary,
  }));
}

// ── Bus Live Location for Child's Bus ──

export async function getChildBusLocation(busId: string): Promise<BusLiveLocation | null> {
  const { data, error } = await supabase
    .from("bus_live_locations")
    .select("*")
    .eq("bus_id", busId)
    .single();

  if (error || !data) return null;
  return data as BusLiveLocation;
}

// ── Subscribe to Bus Live Location (Realtime) ──

export function subscribeToBusLocation(
  busId: string,
  onUpdate: (location: BusLiveLocation) => void
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
        onUpdate(payload.new as BusLiveLocation);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Subscription Status ──

export async function getSubscriptionStatus() {
  const { data, error } = await supabase.rpc("get_subscription_status");
  if (error || !data) return null;
  return data;
}

// ── Google Play Purchase Verification ──

export async function verifyGooglePlayPurchase(
  purchaseToken: string,
  productId: string,
  orderId?: string
): Promise<ApiResult<any>> {
  const { data: { user } } = await supabase.auth.getUser();
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

// ── Trip History for Child ──

export async function getTripHistory(childId: string, limit = 20) {
  const { data, error } = await supabase
    .from("trips")
    .select("id, trip_type, started_at, ended_at, status, buses:bus_id(bus_number)")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
