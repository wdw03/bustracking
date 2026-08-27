// ============================================================================
// BusTracker Edge Function: admin-actions
// Server-side administrative operations for Super Admin
// All actions validate is_super_admin() before executing
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse(401, "UNAUTHORIZED", "Missing authorization.");
    }

    // User-context client (respects RLS)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Admin-context client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse(401, "UNAUTHORIZED", "Invalid session.");
    }

    // Verify Super Admin role (server-side check)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin" || !profile.is_active) {
      return errorResponse(403, "FORBIDDEN", "You are not authorized to perform this action.");
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      // ── Get all pending school requests ──
      case "get_pending_schools": {
        const { data: schools, error } = await supabaseAdmin
          .from("schools")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) return errorResponse(500, "QUERY_ERROR", "Failed to fetch schools.");

        return jsonResponse({ success: true, data: schools });
      }

      // ── Get all schools with stats ──
      case "get_all_schools": {
        const { data: schools, error } = await supabaseAdmin
          .from("schools")
          .select(`
            *,
            school_members(count),
            children(count),
            buses(count),
            drivers(count)
          `)
          .order("created_at", { ascending: false });

        if (error) return errorResponse(500, "QUERY_ERROR", "Failed to fetch schools.");

        return jsonResponse({ success: true, data: schools });
      }

      // ── Approve school (delegates to DB function) ──
      case "approve_school": {
        const { data, error } = await supabaseUser.rpc("approve_school", {
          p_school_id: body.school_id,
        });

        if (error) return errorResponse(500, "RPC_ERROR", error.message);

        return jsonResponse(data);
      }

      // ── Reject school (delegates to DB function) ──
      case "reject_school": {
        const { data, error } = await supabaseUser.rpc("reject_school", {
          p_school_id: body.school_id,
        });

        if (error) return errorResponse(500, "RPC_ERROR", error.message);

        return jsonResponse(data);
      }

      // ── Block school (delegates to DB function) ──
      case "block_school": {
        const { data, error } = await supabaseUser.rpc("block_school", {
          p_school_id: body.school_id,
        });

        if (error) return errorResponse(500, "RPC_ERROR", error.message);

        return jsonResponse(data);
      }

      // ── Get system-wide stats ──
      case "get_system_stats": {
        const [
          { count: totalSchools },
          { count: activeSchools },
          { count: pendingSchools },
          { count: totalParents },
          { count: totalDrivers },
          { count: totalChildren },
          { count: totalBuses },
          { count: activeTrips },
          { count: activeSubs },
        ] = await Promise.all([
          supabaseAdmin.from("schools").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("schools").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabaseAdmin.from("schools").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "parent"),
          supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "driver"),
          supabaseAdmin.from("children").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("buses").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("trips").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
          supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
        ]);

        return jsonResponse({
          success: true,
          data: {
            total_schools: totalSchools,
            active_schools: activeSchools,
            pending_schools: pendingSchools,
            total_parents: totalParents,
            total_drivers: totalDrivers,
            total_children: totalChildren,
            total_buses: totalBuses,
            active_trips: activeTrips,
            active_subscriptions: activeSubs,
          },
        });
      }

      // ── Get audit logs ──
      case "get_audit_logs": {
        const limit = body.limit || 50;
        const offset = body.offset || 0;

        const { data: logs, error } = await supabaseAdmin
          .from("audit_logs")
          .select(`
            *,
            actor:profiles!actor_user_id(full_name, phone),
            school:schools!school_id(name)
          `)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) return errorResponse(500, "QUERY_ERROR", "Failed to fetch audit logs.");

        return jsonResponse({ success: true, data: logs });
      }

      // ── Manage subscription plans ──
      case "create_plan": {
        const { name, price, duration_days, google_product_id, features } = body;

        if (!name || !price || !duration_days) {
          return errorResponse(400, "BAD_REQUEST", "Missing plan fields.");
        }

        const { data: plan, error } = await supabaseAdmin
          .from("subscription_plans")
          .insert({
            name,
            price,
            duration_days,
            google_product_id: google_product_id || null,
            features: features || [],
          })
          .select()
          .single();

        if (error) return errorResponse(500, "INSERT_ERROR", error.message);

        await supabaseAdmin.from("audit_logs").insert({
          actor_user_id: user.id,
          action: "create_subscription_plan",
          entity_type: "subscription_plan",
          entity_id: plan.id,
          metadata: { name, price, duration_days },
        });

        return jsonResponse({ success: true, data: plan });
      }

      // ── Block/unblock user ──
      case "toggle_user_active": {
        const { target_user_id, is_active } = body;

        if (!target_user_id || typeof is_active !== "boolean") {
          return errorResponse(400, "BAD_REQUEST", "Missing target_user_id or is_active.");
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ is_active })
          .eq("id", target_user_id);

        if (error) return errorResponse(500, "UPDATE_ERROR", error.message);

        await supabaseAdmin.from("audit_logs").insert({
          actor_user_id: user.id,
          action: is_active ? "unblock_user" : "block_user",
          entity_type: "profile",
          entity_id: target_user_id,
        });

        return jsonResponse({ success: true });
      }

      default:
        return errorResponse(400, "BAD_REQUEST", `Unknown action: ${action}`);
    }

  } catch (err) {
    console.error("Admin actions error:", err);
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function errorResponse(status: number, code: string, message: string) {
  return new Response(
    JSON.stringify({ success: false, error: { code, message } }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
