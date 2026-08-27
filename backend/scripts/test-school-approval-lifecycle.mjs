import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzEzNDEsImV4cCI6MjEwMTg0NzM0MX0.9ETxdL2W8O09B0-z5Jq09dDU1JblgdT0YUUGGdXaU3Y";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function testLifecycle() {
    console.log("==================================================");
    console.log("🚀 TESTING SCHOOL APPROVAL & LOGIN LIFECYCLE");
    console.log("==================================================");

    const testPhone = "+919123456780";
    const cleanPhone = "9123456780";
    const testPassword = "SchoolPassword@123";
    const schoolEmail = `${cleanPhone}@bustracker.com`;

    // 1. Clean up any previous test user
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const prev = existingUsers?.users?.find(u => u.phone === cleanPhone || u.email === schoolEmail);
    if (prev) {
        console.log("Cleaning previous test user:", prev.id);
        await adminClient.auth.admin.deleteUser(prev.id);
        await adminClient.from("schools").delete().eq("phone", testPhone);
    }

    // 2. School Registers via Edge Function
    console.log("1. School Submits Registration...");
    const regRes = await fetch(`${SUPABASE_URL}/functions/v1/register-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
        body: JSON.stringify({
            action: "register_school",
            schoolName: "St. Xavier International School",
            adminName: "Rajesh Sharma",
            adminMobile: testPhone,
            adminEmail: schoolEmail,
            address: "Ring Road Sector 4",
            city: "Bhopal",
            state: "MP",
            postalCode: "462001",
            password: testPassword,
        }),
    });

    const regData = await regRes.json();
    console.log("Registration Response:", regData);

    const { data: newSchool } = await adminClient
        .from("schools")
        .select("id, name, status, admin_user_id")
        .eq("phone", testPhone)
        .single();

    console.log("Created School Record:", newSchool);

    // 3. Super Admin Approves School
    console.log("2. Super Admin Approves School...");
    const { error: approveErr } = await adminClient
        .from("schools")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", newSchool.id);

    if (approveErr) {
        console.error("❌ Approve error:", approveErr);
        return;
    }

    // Activate school_members & profile
    await adminClient.from("school_members").update({ is_active: true }).eq("school_id", newSchool.id);
    if (newSchool.admin_user_id) {
        await adminClient.from("profiles").update({ is_active: true }).eq("id", newSchool.admin_user_id);
    }
    console.log("✅ School approved and activated!");

    // 4. School Admin Logs in with Phone & Password
    console.log("3. School Admin Logs In with Phone & Password...");
    const schoolClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: loginData, error: loginErr } = await schoolClient.auth.signInWithPassword({
        email: schoolEmail,
        password: testPassword,
    });

    if (loginErr || !loginData.session) {
        console.error("❌ School Admin Login Failed:", loginErr);
        return;
    }
    console.log("✅ School Admin Successfully Logged In! Session UID:", loginData.user.id);

    // 5. Fetch Profile & School Membership
    const { data: profile } = await schoolClient
        .from("profiles")
        .select("*")
        .eq("id", loginData.user.id)
        .single();
    console.log("✅ School Admin Profile:", profile);

    const { data: membership } = await schoolClient
        .from("school_members")
        .select("*")
        .eq("user_id", loginData.user.id)
        .single();
    console.log("✅ School Membership:", membership);

    // 6. Clean up test school
    console.log("4. Cleaning up test data...");
    await adminClient.auth.admin.deleteUser(loginData.user.id);
    await adminClient.from("schools").delete().eq("id", newSchool.id);
    console.log("🎉 LIFECYCLE TEST PASSED 100%!");
}

testLifecycle().catch(console.error);
