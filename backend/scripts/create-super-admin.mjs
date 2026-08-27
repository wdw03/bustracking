// Create Super Admin account in Supabase
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const PHONE = "+919826751348";
const PASSWORD = "Kumar@123";

async function createSuperAdmin() {
    console.log("🔐 Creating Super Admin account...");
    console.log(`   Phone: ${PHONE}`);
    console.log(`   Password: Kumar@123`);
    console.log(`   Role: super_admin\n`);

    // Step 1: Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.phone === PHONE.replace("+", "") || u.phone === PHONE);

    let userId;

    if (existing) {
        console.log(`⚠️  User already exists: ${existing.id}`);
        userId = existing.id;

        // Update password
        const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
            password: PASSWORD,
            phone_confirm: true,
        });
        if (updateErr) {
            console.error("❌ Failed to update password:", updateErr.message);
        } else {
            console.log("✅ Password updated to Kumar@123");
        }
    } else {
        // Step 2: Create user in Supabase Auth
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
            phone: PHONE,
            password: PASSWORD,
            phone_confirm: true, // Skip OTP verification
            user_metadata: { full_name: "Super Admin", role: "super_admin" },
        });

        if (createErr) {
            console.error("❌ Failed to create user:", createErr.message);
            return;
        }

        userId = newUser.user.id;
        console.log(`✅ Auth user created: ${userId}`);
    }

    // Step 3: Upsert profile with super_admin role
    const { error: profileErr } = await supabase
        .from("profiles")
        .upsert({
            id: userId,
            full_name: "Super Admin",
            phone: PHONE,
            role: "super_admin",
            is_active: true,
        }, { onConflict: "id" });

    if (profileErr) {
        console.error("❌ Failed to set profile:", profileErr.message);
    } else {
        console.log("✅ Profile set to super_admin role");
    }

    // Step 4: Verify
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, is_active")
        .eq("id", userId)
        .single();

    console.log("\n📋 Super Admin Profile:");
    console.log(JSON.stringify(profile, null, 2));
    console.log("\n🎯 Login credentials:");
    console.log(`   Phone: 9826751348`);
    console.log(`   Password: Kumar@123`);
    console.log(`   Role: super_admin`);
}

createSuperAdmin().catch(console.error);
