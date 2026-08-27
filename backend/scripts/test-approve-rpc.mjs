import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testRPC() {
    // 1. Create a dummy pending school
    const { data: school, error: err1 } = await supabase.from("schools").insert({
        name: "RPC Test School",
        phone: "+919999911111",
        status: "pending"
    }).select().single();

    if (err1) {
        console.error("Insert error:", err1);
        return;
    }
    console.log("Created test school:", school.id);

    // 2. Test approve_school RPC
    const { data: approveRes, error: approveErr } = await supabase.rpc("approve_school", {
        p_school_id: school.id
    });
    console.log("approve_school RPC result:", approveRes, "error:", approveErr);

    // 3. Test reject_school RPC
    const { data: rejectRes, error: rejectErr } = await supabase.rpc("reject_school", {
        p_school_id: school.id
    });
    console.log("reject_school RPC result:", rejectRes, "error:", rejectErr);

    // Cleanup
    await supabase.from("schools").delete().eq("id", school.id);
    console.log("Cleanup complete!");
}

testRPC().catch(console.error);
