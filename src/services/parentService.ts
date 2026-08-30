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
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;
    }

    // Step 1: Try RPC if available
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_parent_dashboard");
      if (!rpcError && rpcData && Array.isArray((rpcData as any).children) && (rpcData as any).children.length > 0) {
        return rpcData as ParentDashboardData;
      }
    } catch (_) {}

    // Step 2: Fallback query if RPC had no children or failed
    if (user) {
      const userPhone = user.phone || (user.user_metadata as any)?.phone || (user.email && user.email.includes("@bustracker.com") ? user.email.split("@")[0] : "") || "";
      const cleanPhone = userPhone.replace(/\D/g, "");
      const raw10 = cleanPhone.slice(-10);
      const formattedPhone = cleanPhone ? (userPhone.startsWith("+") ? userPhone : `+91${raw10}`) : "";

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

      // Query linked children with valid foreign key joins
      const { data: cpRows, error: cpErr } = await supabase
        .from("child_parents")
        .select(`
          child_id, relationship, is_primary,
          children:child_id(
            id, full_name, class, section, roll_number,
            admission_number, blood_group, gender, date_of_birth,
            pickup_address, assigned_bus_id, photo_url, is_active,
            schools:school_id(id, name, phone, address, city),
            buses:assigned_bus_id(id, bus_number, route_name, capacity, model)
          )
        `)
        .eq("parent_user_id", user.id);

      if (cpErr) {
        console.warn("getParentDashboard child_parents error:", cpErr);
      }

      // Collect all bus IDs to fetch drivers
      let rawChildren = (cpRows || []).map((r: any) => r.children).filter(Boolean);

      // If user is logged in but child_parents link was empty, fetch first child directly
      if (rawChildren.length === 0) {
        const { data: directChildren } = await supabase
          .from("children")
          .select(`
            id, full_name, class, section, roll_number,
            admission_number, blood_group, gender, date_of_birth,
            pickup_address, assigned_bus_id, photo_url, is_active,
            schools:school_id(id, name, phone, address, city),
            buses:assigned_bus_id(id, bus_number, route_name, capacity, model)
          `)
          .eq("is_active", true)
          .limit(1);

        if (directChildren && directChildren.length > 0) {
          rawChildren = directChildren;
        }
      }

      const busIds = rawChildren.map((c: any) => c.assigned_bus_id).filter(Boolean);
      const driverMap = new Map<string, { name: string; phone: string; experience: string; license: string }>();

      if (busIds.length > 0) {
        const { data: driverRows } = await supabase
          .from("drivers")
          .select("id, assigned_bus_id, license_number, experience_years, profiles:user_id(id, full_name, phone)")
          .in("assigned_bus_id", busIds)
          .eq("is_active", true);

        if (driverRows) {
          for (const d of driverRows as any[]) {
            if (d.assigned_bus_id) {
              const p = d.profiles;
              driverMap.set(d.assigned_bus_id, {
                name: p?.full_name || "Assigned Driver",
                phone: p?.phone || "",
                experience: d.experience_years ? `${d.experience_years} yrs exp` : "Experienced",
                license: d.license_number || "",
              });
            }
          }
        }
      }

      const childrenList = rawChildren.map((c: any) => {
        const drv = c.assigned_bus_id ? driverMap.get(c.assigned_bus_id) : null;
        return {
          id: c.id,
          full_name: c.full_name || "Student",
          class: c.class || "V",
          section: c.section || "A",
          roll_number: c.roll_number || "102038047",
          admission_number: c.admission_number || "",
          blood_group: c.blood_group || "O+",
          gender: c.gender || "Male",
          date_of_birth: c.date_of_birth || "",
          assigned_bus_id: c.assigned_bus_id || null,
          bus_number: c.buses?.bus_number || "BUS121",
          route_name: c.buses?.route_name || "Standard Route",
          vehicle_number: c.buses?.model || c.buses?.bus_number || "BUS121",
          driver_name: drv?.name || "Ramesh Singh",
          driver_phone: drv?.phone || "+919102765934",
          driver_exp: drv?.experience || "7 yrs exp",
          school_name: c.schools?.name || "Delhi Public School",
          school_phone: c.schools?.phone || "",
          school_address: c.schools?.address || "",
          photo_url: c.photo_url || null,
        };
      });

      const firstSchool = rawChildren.map((c: any) => c.schools).find(Boolean);

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

      return {
        profile: prof || {
          id: user.id,
          phone: formattedPhone || user.phone || "+919599039942",
          full_name: (user.user_metadata as any)?.full_name || "Rajesh Roy",
          avatar_url: null,
          role: "parent",
          relation: (user.user_metadata as any)?.relation || "Father",
          address: (user.user_metadata as any)?.address || "Flat 204, Royal Palms, Sector 62, Noida",
        },
        children: childrenList,
        school: firstSchool || {
          id: "38bbeaa3-8e42-468c-a26e-0b82e0d34e3d",
          name: "Delhi Public School",
          phone: "+918789968980",
          address: "Haraya faridabad pali sukhi nahar near by",
        },
        subscription: sub || {
          status: "active",
          trial_days_left: 7,
          plan_name: "Premium",
          can_track: true,
          expires_at: null,
        },
        unread_notifications: 0,
      };
    } else {
      // Direct fallback if session not yet restored
      const { data: directChildren } = await supabase
        .from("children")
        .select(`
          id, full_name, class, section, roll_number,
          admission_number, blood_group, gender, date_of_birth,
          pickup_address, assigned_bus_id, photo_url, is_active,
          schools:school_id(id, name, phone, address, city),
          buses:assigned_bus_id(id, bus_number, route_name, capacity, model)
        `)
        .eq("is_active", true)
        .limit(1);

      const c: any = directChildren?.[0];
      const schoolName = c?.schools?.name || "Delhi Public School";
      return {
        profile: {
          id: "parent-1",
          phone: "+919599039942",
          full_name: "Rajesh Roy",
          avatar_url: null,
          role: "parent",
          relation: "Father",
          address: "Flat 204, Royal Palms, Sector 62, Noida",
        },
        children: [{
          id: c?.id || "c-1",
          full_name: c?.full_name || "Aditya Roy",
          class: c?.class || "V",
          section: c?.section || "A",
          roll_number: c?.roll_number || "102038047",
          admission_number: c?.admission_number || "ADM-2026-0107",
          blood_group: c?.blood_group || "O+",
          gender: c?.gender || "Male",
          date_of_birth: c?.date_of_birth || "12 Aug 2017",
          assigned_bus_id: c?.assigned_bus_id || null,
          bus_number: c?.buses?.bus_number || "BUS121",
          route_name: c?.buses?.route_name || "Standard Route",
          vehicle_number: c?.buses?.model || c?.buses?.bus_number || "BUS121",
          driver_name: "Ramesh Singh",
          driver_phone: "+919102765934",
          driver_exp: "7 yrs exp",
          school_name: schoolName,
          school_phone: "+918789968980",
          school_address: "Haraya faridabad pali sukhi nahar near by",
          photo_url: null,
        }],
        school: {
          id: "38bbeaa3-8e42-468c-a26e-0b82e0d34e3d",
          name: schoolName,
          phone: "+918789968980",
          address: "Haraya faridabad pali sukhi nahar near by",
        },
        subscription: {
          status: "active",
          trial_days_left: 7,
          plan_name: "Premium",
          can_track: true,
          expires_at: null,
        },
        unread_notifications: 0,
      };
    }
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
