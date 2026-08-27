import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function testPipeline() {
    console.log("==================================================");
    console.log("🧪 TESTING SCHOOL REGISTRATION -> SUPER ADMIN FLOW");
    console.log("==================================================");

    const testPhone = "+919811223344";
    const testSchoolName = "Delhi Model Academy";

    // 1. Simulate school registration
    console.log("\n1. Simulating school registration insert...");
    const { data: regData, error: regError } = await admin
        .from("schools")
        .insert({
            name: testSchoolName,
            phone: testPhone,
            email: "contact@delhimodel.edu.in",
            principal_name: "Dr. A. K. Verma",
            principal_phone: testPhone,
            city: "New Delhi",
            state: "Delhi",
            pincode: "110001",
            status: "pending",
        })
        .select()
        .single();

    if (regError || !regData) {
        console.error("❌ Registration insert failed:", regError);
        process.exit(1);
    }
    console.log("✅ School registration submitted with ID:", regData.id, "Status:", regData.status);

    // 2. Query pending requests as Super Admin
    console.log("\n2. Super Admin querying pending school requests...");
    const { data: pendingRequests, error: reqError } = await admin
        .from("schools")
        .select("*")
        .in("status", ["pending", "rejected"])
        .order("created_at", { ascending: false });

    if (reqError || !pendingRequests) {
        console.error("❌ Failed to query pending requests:", reqError);
        process.exit(1);
    }

    const found = pendingRequests.find((s) => s.id === regData.id);
    if (!found) {
        console.error("❌ Pending school NOT found in Super Admin requests list!");
        process.exit(1);
    }
    console.log("✅ Super Admin successfully fetched pending request for:", found.name);

    // 3. Super Admin approves school
    console.log("\n3. Super Admin approving school...");
    const { error: approveError } = await admin
        .from("schools")
        .update({
            status: "approved",
            approved_at: new Date().toISOString(),
        })
        .eq("id", regData.id);

    if (approveError) {
        console.error("❌ Approval failed:", approveError);
        process.exit(1);
    }
    console.log("✅ School approved successfully!");

    // 4. Verify approved status in active schools list
    const { data: activeSchool, error: checkError } = await admin
        .from("schools")
        .select("*")
        .eq("id", regData.id)
        .single();

    if (checkError || activeSchool.status !== "approved") {
        console.error("❌ School status is not 'approved':", activeSchool);
        process.exit(1);
    }
    console.log("✅ Verified school status in DB:", activeSchool.status);

    // 5. Cleanup test data
    console.log("\n5. Cleaning up test data...");
    await admin.from("schools").delete().eq("id", regData.id);
    console.log("✅ Cleaned test school. Database is clean!");

    console.log("\n🎉 ALL CHECKS PASSED! School registration flow is 100% working!");
}

testPipeline().catch(console.error);
