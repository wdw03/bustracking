// ============================================================================
// BusTracker: Driver Service
// Driver-specific operations — profile, bus, school info
// Uses get_driver_dashboard() RPC for secure single-call data
// ============================================================================

import { supabase } from "./supabase";
import type { DriverDashboardData, Driver, Bus, School, ApiResult } from "./types";

// ── Dashboard (returns all driver data securely with resilient fallback) ──

export async function getDriverDashboard(): Promise<DriverDashboardData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Step 1: Try RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_driver_dashboard");
    if (!rpcError && rpcData && (rpcData as any).driver) {
      return rpcData as DriverDashboardData;
    }

    // Step 2: Fallback query if RPC had issues
    if (user) {
      const cleanPhone = (user.phone || "").replace(/\D/g, "");
      const raw10 = cleanPhone.slice(-10);
      const formattedPhone = user.phone ? (user.phone.startsWith("+") ? user.phone : `+91${raw10}`) : "";

      // Ensure driver record is present and linked to school
      let { data: driverRec } = await supabase
        .from("drivers")
        .select("*, buses:assigned_bus_id(*), schools:school_id(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!driverRec && raw10) {
        const { data: contacts } = await supabase
          .from("authorized_contacts")
          .select("id, school_id")
          .or(`phone.eq.${formattedPhone},phone.eq.${cleanPhone},phone.eq.${raw10}`)
          .eq("contact_type", "driver")
          .limit(1)
          .maybeSingle();

        if (contacts) {
          const { data: newDriver } = await supabase.from("drivers").upsert({
            school_id: contacts.school_id,
            user_id: user.id,
            is_active: true,
          }, { onConflict: "user_id" }).select("*, buses:assigned_bus_id(*), schools:school_id(*)").single();

          driverRec = newDriver;
        }
      }

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      return {
        profile: prof || {
          id: user.id,
          phone: formattedPhone || user.phone || "",
          full_name: (user.user_metadata as any)?.full_name || "Driver",
          avatar_url: null,
          role: "driver",
        },
        driver: driverRec || null,
        bus: driverRec?.buses || null,
        school: driverRec?.schools || null,
        active_trip: null,
      } as any;
    }

    return (rpcData as DriverDashboardData) || null;
  } catch (e) {
    console.warn("getDriverDashboard fallback error:", e);
    return null;
  }
}

// ── Driver Profile ──

export async function getDriverProfile(userId: string): Promise<Driver | null> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as Driver;
}

// ── Driver's Assigned Bus ──

export async function getDriverBus(driverId: string): Promise<Bus | null> {
  const { data, error } = await supabase
    .from("drivers")
    .select("assigned_bus_id, buses:assigned_bus_id(*)")
    .eq("id", driverId)
    .single();

  if (error || !data || !data.buses) return null;
  return (data.buses as any) as Bus;
}

// ── Driver's School ──

export async function getDriverSchool(driverId: string): Promise<School | null> {
  const { data, error } = await supabase
    .from("drivers")
    .select("school_id, schools:school_id(id, name, phone, email, address, principal_name, principal_phone, logo_url)")
    .eq("id", driverId)
    .single();

  if (error || !data || !data.schools) return null;
  return (data.schools as any) as School;
}

// ── Students on Driver's Bus ──

export async function getStudentsOnBus(busId: string) {
  const { data, error } = await supabase
    .from("children")
    .select("id, full_name, class, section, pickup_address, photo_url")
    .eq("assigned_bus_id", busId)
    .eq("is_active", true)
    .order("full_name");

  if (error || !data) return [];
  return data;
}

// ── Active Trip ──

export async function getActiveTrip(driverId: string) {
  const { data, error } = await supabase
    .from("trips")
    .select("id, trip_type, started_at, bus_id")
    .eq("driver_id", driverId)
    .eq("status", "in_progress")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

// ── Trip Management (via secure RPC) ──

export async function startTrip(tripType: "pickup" | "drop"): Promise<ApiResult<{ trip_id: string; bus_id: string; trip_type: string }>> {
  const { data, error } = await supabase.rpc("start_trip", { p_trip_type: tripType });
  if (error) return { success: false, error: error.message };
  if (data && !data.success) return { success: false, error: data.error?.message || "Failed to start trip" };
  return { success: true, data: data?.data };
}

export async function stopTrip(tripId: string): Promise<ApiResult<void>> {
  const { data, error } = await supabase.rpc("stop_trip", { p_trip_id: tripId });
  if (error) return { success: false, error: error.message };
  if (data && !data.success) return { success: false, error: data.error?.message || "Failed to stop trip" };
  return { success: true };
}

// ── Trip History ──

export async function getDriverTripHistory(driverId: string, limit = 20) {
  const { data, error } = await supabase
    .from("trips")
    .select("id, trip_type, started_at, ended_at, status, buses:bus_id(bus_number), schools:school_id(name)")
    .eq("driver_id", driverId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
