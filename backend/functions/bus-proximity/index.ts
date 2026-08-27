// ============================================================================
// BusTracker Edge Function: bus-proximity
// Server-side 1KM proximity detection using PostGIS
// Triggered by database webhook on bus_live_locations changes
// Sends push notifications to parents when bus is within 1km of pickup
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-signature, x-app-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

const PROXIMITY_RADIUS_METERS = 1000; // 1 KM

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Service role client for privileged server-side operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // ── Webhook payload from Supabase Database Webhook ──
    // { type: "UPDATE", table: "bus_live_locations", record: { bus_id, latitude, ... }, old_record: ... }
    const record = body.record || body;
    const busId = record.bus_id;

    if (!busId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing bus_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process when bus is actively broadcasting
    if (record.is_live !== true) {
      return new Response(
        JSON.stringify({ success: true, message: "Bus not live, skipping." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Find children within 1km using PostGIS (server-side) ──
    const { data: nearbyChildren, error: proximityError } = await supabase.rpc(
      "find_children_near_bus",
      {
        p_bus_id: busId,
        p_radius_meters: PROXIMITY_RADIUS_METERS,
      }
    );

    if (proximityError) {
      console.error("Proximity query error:", proximityError);
      return new Response(
        JSON.stringify({ success: false, error: "Proximity query failed." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!nearbyChildren || nearbyChildren.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No children in proximity." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Get current active trip for this bus ──
    const { data: activeTrip } = await supabase
      .from("trips")
      .select("id")
      .eq("bus_id", busId)
      .eq("status", "in_progress")
      .limit(1)
      .single();

    const tripId = activeTrip?.id || null;

    // ── Process each nearby child ──
    const notifiedParents: string[] = [];

    for (const child of nearbyChildren) {
      // ── Duplicate prevention: check bus_proximity_events ──
      const { data: existingEvent } = await supabase
        .from("bus_proximity_events")
        .select("id, notified_at")
        .eq("bus_id", busId)
        .eq("child_id", child.child_id)
        .eq("trip_id", tripId)
        .limit(1)
        .single();

      if (existingEvent?.notified_at) {
        // Already notified for this approach in this trip — skip
        continue;
      }

      // ── Create/update proximity event ──
      if (!existingEvent) {
        await supabase.from("bus_proximity_events").insert({
          bus_id: busId,
          child_id: child.child_id,
          trip_id: tripId,
          entered_at: new Date().toISOString(),
          notified_at: new Date().toISOString(),
        });
      } else {
        await supabase
          .from("bus_proximity_events")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", existingEvent.id);
      }

      // ── Create in-app notification record ──
      const distanceKm = (child.distance_meters / 1000).toFixed(1);
      const notificationTitle = "🚌 Bus Approaching!";
      const notificationBody = `Bus is ${distanceKm}km away from ${child.child_name}'s pickup point.`;

      await supabase.from("notifications").insert({
        user_id: child.parent_user_id,
        title: notificationTitle,
        body: notificationBody,
        type: "bus_nearby",
        data: {
          bus_id: busId,
          child_id: child.child_id,
          distance_meters: child.distance_meters,
          trip_id: tripId,
        },
      });

      // ── Send push notification via Expo Push API ──
      const { data: pushTokens } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", child.parent_user_id)
        .eq("is_active", true);

      if (pushTokens && pushTokens.length > 0) {
        const tokens = pushTokens.map((t: { token: string }) => t.token);

        try {
          const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(Deno.env.get("EXPO_PUSH_ACCESS_TOKEN")
                ? { Authorization: `Bearer ${Deno.env.get("EXPO_PUSH_ACCESS_TOKEN")}` }
                : {}),
            },
            body: JSON.stringify(
              tokens.map((token: string) => ({
                to: token,
                title: notificationTitle,
                body: notificationBody,
                sound: "default",
                data: {
                  type: "bus_nearby",
                  bus_id: busId,
                  child_id: child.child_id,
                },
                channelId: "bus-alerts",
                priority: "high",
              }))
            ),
          });

          if (!pushResponse.ok) {
            console.error("Push API error:", await pushResponse.text());
          }
        } catch (pushErr) {
          console.error("Push notification send error:", pushErr);
        }
      }

      notifiedParents.push(child.parent_user_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          bus_id: busId,
          children_in_proximity: nearbyChildren.length,
          parents_notified: notifiedParents.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Bus proximity edge function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
