import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzEzNDEsImV4cCI6MjEwMTg0NzM0MX0.9ETxdL2W8O09B0-z5Jq09dDU1JblgdT0YUUGGdXaU3Y";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const userClient = createClient(SUPABASE_URL, ANON_KEY);

async function testSuperAdminLiveActions() {
    console.log("1. Logging in as Super Admin (9826751348 / Kumar@123)...");
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
        email: "9826751348@bustracker.com",
        password: "Kumar@123",
    });

    if (authError || !authData.session) {
        console.error("❌ Login failed:", authError);
        return;
    }
    console.log("✅ Super Admin logged in! UID:", authData.user.id);

    // 2. Create pending school
    const { data: testSchool, error: schoolErr } = await adminClient.from("schools").insert({
        name: "Test Approval High School",
        phone: "+918888877777",
        status: "pending",
    }).select().single();

    if (schoolErr) {
        console.error("❌ Create school error:", schoolErr);
        return;
    }
    console.log("✅ Created test school:", testSchool.id);

    // 3. Test approving with logged-in Super Admin user client (direct table update)
    console.log("3. Attempting table update from Super Admin client...");
    const { data: updateData, error: updateErr } = await userClient
        .from("schools")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", testSchool.id)
        .select();

    console.log("Table update result:", updateData, "Error:", updateErr);

    // 4. Test RPC approve_school with logged-in user client
    console.log("4. Attempting approve_school RPC from Super Admin client...");
    const { data: rpcData, error: rpcErr } = await userClient.rpc("approve_school", {
        p_school_id: testSchool.id
    });
    console.log("RPC result:", rpcData, "Error:", rpcErr);

    // Cleanup
    await adminClient.from("schools").delete().eq("id", testSchool.id);
    console.log("✅ Test complete and cleaned up!");
}

testSuperAdminLiveActions().catch(console.error);
