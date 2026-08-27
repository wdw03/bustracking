import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testRejectFlow() {
    console.log("1. Creating pending test school...");
    const { data: newSchool, error: insertError } = await supabase.from("schools").insert({
        name: "Reject Test Academy",
        phone: "+919999988888",
        city: "Delhi",
        status: "pending",
    }).select().single();

    if (insertError) {
        console.error("Insert error:", insertError);
        return;
    }
    console.log("✅ Created school:", newSchool.id, "status:", newSchool.status);

    console.log("2. Simulating Super Admin Reject...");
    const { error: rejectError } = await supabase
        .from("schools")
        .update({ status: "rejected" })
        .eq("id", newSchool.id);

    if (rejectError) {
        console.error("❌ Reject error:", rejectError);
        return;
    }
    console.log("✅ Update status to 'rejected' succeeded!");

    console.log("3. Verifying updated status in DB...");
    const { data: fetched } = await supabase.from("schools").select("id, name, status").eq("id", newSchool.id).single();
    console.log("Verified status:", fetched.status);

    console.log("4. Cleaning up...");
    await supabase.from("schools").delete().eq("id", newSchool.id);
    console.log("✅ Cleanup done!");
}

testRejectFlow().catch(console.error);
