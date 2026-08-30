// ============================================================================
// BusTracker: Parent Service
// Parent-specific operations — children, bus info, dashboard
// Uses get_parent_dashboard() RPC for secure single-call data
// ============================================================================

import { supabase } from "./supabase";
import type { ParentDashboardData, BusLiveLocation, ApiResult } from "./types";

// ── Dashboard (returns all parent data securely with robust fallback) ──

export async function getParentDashboard(): Promise<ParentDashboardData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Step 1: Try RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_parent_dashboard");
    if (!rpcError && rpcData && Array.isArray((rpcData as any).children) && (rpcData as any).children.length > 0) {
      return rpcData as ParentDashboardData;
    }

    // Step 2: Fallback query if RPC had no children or failed
    if (user) {
      const cleanPhone = (user.phone || "").replace(/\D/g, "");
      const raw10 = cleanPhone.slice(-10);
      const formattedPhone = user.phone ? (user.phone.startsWith("+") ? user.phone : `+91${raw10}`) : "";

      // Ensure any authorized contact for this parent's phone is linked in child_parents
      if (raw10) {
        const { data: contacts } = await supabase
          .from("authorized_contacts")
          .select("id, child_id, school_id")
          .or(`phone.eq.${formattedPhone},phone.eq.${cleanPhone},phone.eq.${raw10}`)
          .eq("contact_type", "parent");

        if (contacts && contacts.length > 0) {
          for (const c of contacts) {
            if (c.child_id) {
              await supabase.from("child_parents").upsert({
                child_id: c.child_id,
                parent_user_id: user.id,
                relationship: "guardian",
                is_primary: true,
              }, { onConflict: "child_id,parent_user_id" });
            }
          }
        }
      }

      // Query linked children
      const { data: cpRows } = await supabase
        .from("child_parents")
        .select(`
          child_id,
          relationship,
          is_primary,
          children:child_id(
            id, full_name, class, section, roll_number,
            admission_number, blood_group,
            pickup_address, assigned_bus_id, photo_url, is_active,
            buses:assigned_bus_id(id, bus_number, route_name, capacity, vehicle_number,
              driver:driver_id(id, full_name, phone)
            ),
            schools:school_id(id, name, phone, address)
          )
        `)
        .eq("parent_user_id", user.id);

      const childrenList = (cpRows || [])
        .map((r: any) => r.children)
        .filter(Boolean)
        .map((c: any) => ({
          id: c.id,
          full_name: c.full_name,
          class: c.class,
          section: c.section,
          roll_number: c.roll_number,
          admission_number: c.admission_number || "",
          blood_group: c.blood_group || "",
          assigned_bus_id: c.assigned_bus_id,
          bus_number: c.buses?.bus_number || "Bus",
          route_name: c.buses?.route_name || "Route",
          vehicle_number: c.buses?.vehicle_number || "",
          driver_name: c.buses?.driver?.full_name || "",
          driver_phone: c.buses?.driver?.phone || "",
          school_name: c.schools?.name || "",
          school_phone: c.schools?.phone || "",
          school_address: c.schools?.address || "",
          photo_url: c.photo_url || null,
        }));

      const firstSchool = (cpRows || []).map((r: any) => r.children?.schools).find(Boolean);

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

      return {
        profile: prof || {
          id: user.id,
          phone: formattedPhone || user.phone || "",
          full_name: (user.user_metadata as any)?.full_name || "Parent",
          avatar_url: null,
          role: "parent",
        },
        children: childrenList,
        school: firstSchool || (rpcData as any)?.school,
        subscription: sub || (rpcData as any)?.subscription || { is_active: true, has_subscription: true },
        unread_notifications: (rpcData as any)?.unread_notifications || 0,
      } as any;
    }

    return (rpcData as ParentDashboardData) || null;
  } catch (e) {
    console.warn("getParentDashboard fallback error:", e);
    return null;
  }
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
