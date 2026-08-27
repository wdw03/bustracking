// ============================================================================
// BusTracker: Driver Service
// Driver-specific operations — profile, bus, school info
// Uses get_driver_dashboard() RPC for secure single-call data
// ============================================================================

import { supabase } from "./supabase";
import type { DriverDashboardData, Driver, Bus, School, ApiResult } from "./types";

// ── Dashboard (single RPC call — returns all driver data securely) ──

export async function getDriverDashboard(): Promise<DriverDashboardData | null> {
  const { data, error } = await supabase.rpc("get_driver_dashboard");
  if (error || !data) {
    console.warn("getDriverDashboard error:", error);
    return null;
  }
  return data as DriverDashboardData;
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
