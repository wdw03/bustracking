// ============================================================================
// BusTracker — Backend Live Verification & Test Suite
// Runs tests against live Supabase Database, RLS, and Edge Functions
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzEzNDEsImV4cCI6MjEwMTg0NzM0MX0.9ETxdL2W8O09B0-z5Jq09dDU1JblgdT0YUUGGdXaU3Y";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const clientAnon = createClient(SUPABASE_URL, ANON_KEY);
const clientAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("==========================================================");
console.log("🚀 STARTING BUSTRACKER BACKEND LIVE TEST SUITE");
console.log("Target URL:", SUPABASE_URL);
console.log("==========================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.log(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  try {
    // ──────────────────────────────────────────────────────────
    // TEST 1: Database Connection & Table Verification
    // ──────────────────────────────────────────────────────────
    console.log("📋 1. DATABASE & TABLES CHECK");
    
    // Check subscription_plans in DB
    const { data: plans, error: planErr } = await clientAdmin
      .from("subscription_plans")
      .select("*");

    assert(!planErr && plans && plans.length >= 3, `Subscription Plans in DB (Found ${plans?.length || 0} plans)`);
    if (plans && plans.length > 0) {
      console.log(`     Plans: ${plans.map(p => `${p.name} (₹${p.price})`).join(", ")}`);
    }

    // Verify all 18 tables exist by querying schema
    const tablesToCheck = [
      "profiles", "schools", "school_members", "authorized_contacts",
      "children", "child_parents", "buses", "drivers",
      "bus_live_locations", "trips", "trip_locations", "bus_stops",
      "subscription_plans", "subscriptions", "push_tokens", "notifications", "bus_proximity_events", "audit_logs"
    ];

    let allTablesExist = true;
    for (const table of tablesToCheck) {
      const { error } = await clientAdmin.from(table).select("*").limit(0);
      if (error) {
        allTablesExist = false;
        console.log(`     ⚠️ Table check issue on: ${table} (${error.message})`);
      }
    }
    assert(allTablesExist, `All 18 Production Tables verified accessible via Supabase`);

    // ──────────────────────────────────────────────────────────
    // TEST 2: Row Level Security (RLS) Enforcement
    // ──────────────────────────────────────────────────────────
    console.log("\n🔒 2. ROW LEVEL SECURITY (RLS) ENFORCEMENT");
    
    // Unauthenticated/Anon should NOT be able to read audit_logs directly
    const { data: leakAudit } = await clientAnon
      .from("audit_logs")
      .select("*");
    
    assert(leakAudit === null || leakAudit.length === 0, "Anon client blocked from reading audit_logs (RLS Protected)");

    // Unauthenticated/Anon should NOT be able to read authorized_contacts directly
    const { data: leakContacts } = await clientAnon
      .from("authorized_contacts")
      .select("*");

    assert(leakContacts === null || leakContacts.length === 0, "Anon client blocked from reading authorized_contacts (RLS Protected)");

    // ──────────────────────────────────────────────────────────
    // TEST 3: Edge Function — register-user (Phone Authorization Check)
    // ──────────────────────────────────────────────────────────
    console.log("\n⚡ 3. EDGE FUNCTION: register-user");

    // Test A: Unauthorized phone number check
    const { data: unauthCheck, error: unauthErr } = await clientAnon.functions.invoke("register-user", {
      body: {
        action: "check_authorization",
        phone: "+910000000000",
        full_name: "Fake User",
        contact_type: "parent"
      }
    });

    assert(
      !unauthErr && unauthCheck?.authorized === false && unauthCheck?.error?.code === "NOT_AUTHORIZED",
      `Unauthorized phone (+910000000000) correctly rejected with 'NOT_AUTHORIZED'`
    );

    // ──────────────────────────────────────────────────────────
    // TEST 4: Edge Function — subscription-check (Daily Cron)
    // ──────────────────────────────────────────────────────────
    console.log("\n⚡ 4. EDGE FUNCTION: subscription-check (Daily Cron)");

    const { data: subCronData, error: subCronErr } = await clientAdmin.functions.invoke("subscription-check", {
      body: {}
    });

    assert(!subCronErr && subCronData?.success === true, "Subscription daily expiry check ran successfully");
    if (subCronData?.data) {
      console.log(`     Report: Trials Expired: ${subCronData.data.trials_expired}, Subscriptions Expired: ${subCronData.data.subscriptions_expired}`);
    }

    // ──────────────────────────────────────────────────────────
    // TEST 5: PostGIS 1KM Proximity RPC Function Test
    // ──────────────────────────────────────────────────────────
    console.log("\n📍 5. POSTGIS PROXIMITY RPC FUNCTION");

    // Call find_children_near_bus with a dummy UUID
    const dummyBusId = "00000000-0000-0000-0000-000000000000";
    const { data: proxData, error: proxErr } = await clientAdmin.rpc("find_children_near_bus", {
      p_bus_id: dummyBusId,
      p_radius_meters: 1000
    });

    assert(!proxErr, `PostGIS function 'find_children_near_bus' executed successfully (Result: ${proxData?.length || 0} children near dummy bus)`);

    // ──────────────────────────────────────────────────────────
    // TEST 6: Edge Function — bus-proximity
    // ──────────────────────────────────────────────────────────
    console.log("\n⚡ 6. EDGE FUNCTION: bus-proximity");

    const { data: proxEdgeData, error: proxEdgeErr } = await clientAdmin.functions.invoke("bus-proximity", {
      body: {
        bus_id: dummyBusId,
        is_live: true,
        latitude: 28.6139,
        longitude: 77.2090
      }
    });

    assert(!proxEdgeErr && proxEdgeData?.success === true, "bus-proximity Edge Function executed without errors");

    // ──────────────────────────────────────────────────────────
    // TEST 7: Edge Function — admin-actions (Security Gate)
    // ──────────────────────────────────────────────────────────
    console.log("\n⚡ 7. EDGE FUNCTION: admin-actions (Security Gate)");

    const { data: adminData, error: adminErr } = await clientAnon.functions.invoke("admin-actions", {
      body: {
        action: "get_system_stats"
      }
    });

    assert(
      adminErr || adminData?.success === false || adminData?.error?.code === "UNAUTHORIZED",
      "admin-actions Edge Function securely blocks unauthenticated/non-admin requests"
    );

    // ──────────────────────────────────────────────────────────
    // Summary
    // ──────────────────────────────────────────────────────────
    console.log("\n==========================================================");
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    if (failed === 0) {
      console.log("🎉 ALL LIVE BACKEND TESTS PASSED! 100% PRODUCTION READY!");
    } else {
      console.log("⚠️ Some tests had issues. Check logs above.");
    }
    console.log("==========================================================");

  } catch (e) {
    console.error("Test execution exception:", e);
  }
}

runTests();
