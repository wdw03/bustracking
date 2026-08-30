// ============================================================================
// BusTracker: Tracking Service
// Live GPS tracking operations — location updates, bus monitoring
// Driver → Supabase RPC → Realtime → Parent
// ============================================================================

import { supabase } from "./supabase";
import type { BusLiveLocation, ApiResult } from "./types";

// ── Driver: Update Bus Location (via RPC — server validates driver owns bus) ──

export async function updateBusLocation(
  busId: string,
  latitude: number,
  longitude: number,
  speed: number = 0,
  heading: number = 0,
  accuracy: number = 0
): Promise<ApiResult<void>> {
  try {
    const { data, error } = await supabase.rpc("update_bus_location", {
      p_bus_id: busId,
      p_lat: latitude,
      p_lng: longitude,
      p_speed: speed,
      p_heading: heading,
      p_accuracy: accuracy,
    });

    if (!error && data?.success !== false) {
      return { success: true };
    }
  } catch (_) {}

  // Direct upsert fallback
  try {
    const { error: upsertErr } = await supabase
      .from("bus_live_locations")
      .upsert({
        bus_id: busId,
        latitude,
        longitude,
        speed,
        heading,
        accuracy,
        is_live: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "bus_id" });

    if (upsertErr) return { success: false, error: upsertErr.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Location update failed" };
  }
}

// ── Driver: Stop Broadcasting Location ──

export async function stopBusLocation(busId: string): Promise<ApiResult<void>> {
  const { data, error } = await supabase.rpc("stop_bus_location", { p_bus_id: busId });
  if (error) return { success: false, error: error.message };
  if (data && !data.success) return { success: false, error: data.error?.message };
  return { success: true };
}

// ── Get Single Bus Location ──

export async function getBusLocation(busId: string): Promise<BusLiveLocation | null> {
  const { data, error } = await supabase
    .from("bus_live_locations")
    .select("*")
    .eq("bus_id", busId)
    .single();

  if (error || !data) return null;
  return data as BusLiveLocation;
}

// ── Get All Bus Locations for School (school admin map) ──

export async function getAllBusLocations(schoolId: string): Promise<(BusLiveLocation & { bus_number: string })[]> {
  const { data, error } = await supabase
    .from("bus_live_locations")
    .select("*, buses!inner(school_id, bus_number, route_name, is_active)")
    .eq("buses.school_id", schoolId)
    .eq("buses.is_active", true);

  if (error || !data) return [];
  return data.map((row: any) => ({
    ...row,
    bus_number: row.buses?.bus_number || "Unknown",
  }));
}

// ── Subscribe to Bus Location Updates (Realtime) ──

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

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Subscribe to ALL Bus Locations for School (admin live map) ──

export function subscribeToAllSchoolBuses(
  busIds: string[],
  onUpdate: (location: BusLiveLocation) => void
) {
  const channels = busIds.map((busId) =>
    supabase
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
      .subscribe()
  );

  return () => {
    channels.forEach((ch) => supabase.removeChannel(ch));
  };
}

// ── Trip Location History (for replay) ──

export async function getTripLocations(tripId: string) {
  const { data, error } = await supabase
    .from("trip_locations")
    .select("*")
    .eq("trip_id", tripId)
    .order("recorded_at", { ascending: true });

  if (error || !data) return [];
  return data;
}

// ── Save Trip Location Point (for history) ──

export async function saveTripLocation(
  tripId: string,
  latitude: number,
  longitude: number,
  speed?: number,
  heading?: number,
  accuracy?: number
): Promise<ApiResult<void>> {
  const { data, error } = await supabase.rpc("save_trip_location", {
    p_trip_id: tripId,
    p_lat: latitude,
    p_lng: longitude,
    p_speed: speed ?? null,
    p_heading: heading ?? null,
    p_accuracy: accuracy ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
