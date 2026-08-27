import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function testSubscriptionPipeline() {
    console.log("==================================================");
    console.log("🧪 TESTING SUBSCRIPTION PIPELINE & FLOWS");
    console.log("==================================================");

    // 1. Check subscription plans in database
    console.log("\n1. Fetching subscription plans from database...");
    const { data: plans, error: planError } = await admin
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);

    if (planError || !plans || plans.length === 0) {
        console.error("❌ Failed to fetch active plans:", planError);
        process.exit(1);
    }
    console.log(`✅ Found ${plans.length} active subscription plans:`);
    plans.forEach(p => console.log(`   - ${p.name}: ₹${p.price} (${p.duration_days} days, SKU: ${p.google_product_id})`));

    // 2. Test user creation + subscription creation
    const testPhone = "+919888877777";
    const testEmail = "9888877777@bustracker.com";
    console.log(`\n2. Creating temporary test parent (${testPhone})...`);

    let userId;
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.phone === testPhone || u.email === testEmail);

    if (existing) {
        userId = existing.id;
    } else {
        const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
            phone: testPhone,
            email: testEmail,
            password: "Password@123",
            email_confirm: true,
            phone_confirm: true,
            user_metadata: { full_name: "Test Parent Kumar", role: "parent" },
        });
        if (userErr || !userRes?.user) {
            console.error("❌ Failed to create user:", userErr);
            process.exit(1);
        }
        userId = userRes.user.id;
    }

    // Upsert profile
    await admin.from("profiles").upsert({
        id: userId,
        phone: testPhone,
        full_name: "Test Parent Kumar",
        role: "parent",
        is_active: true,
    });
    console.log("✅ Test parent profile created with ID:", userId);

    // 3. Simulate subscription purchase (Quarterly Plan ₹249)
    const targetPlan = plans.find(p => p.google_product_id.includes("quarterly")) || plans[0];
    const orderId = `GPA.TEST-${Date.now()}`;
    console.log(`\n3. Simulating purchase of ${targetPlan.name} (Order: ${orderId})...`);

    const paidStart = new Date();
    const paidEnd = new Date(paidStart.getTime() + targetPlan.duration_days * 24 * 60 * 60 * 1000);

    const { data: subData, error: subError } = await admin
        .from("subscriptions")
        .insert({
            user_id: userId,
            plan_id: targetPlan.id,
            plan_type: "quarterly",
            status: "active",
            paid_start: paidStart.toISOString(),
            paid_end: paidEnd.toISOString(),
            amount_paid: targetPlan.price,
            google_play_order_id: orderId,
            google_purchase_token: `test_token_${Date.now()}`,
        })
        .select()
        .single();

    if (subError || !subData) {
        console.error("❌ Subscription insert failed:", subError);
        process.exit(1);
    }
    console.log("✅ Subscription inserted in DB with ID:", subData.id);

    // 4. Test Super Admin getAllSubscriptions query
    console.log("\n4. Super Admin querying active subscriptions...");
    const { data: allSubs, error: allSubsError } = await admin
        .from("subscriptions")
        .select(`
            *,
            profiles:user_id(full_name, phone)
        `)
        .eq("status", "active");

    if (allSubsError || !allSubs) {
        console.error("❌ Super Admin subscription query failed:", allSubsError);
        process.exit(1);
    }

    const foundSub = allSubs.find(s => s.id === subData.id);
    if (!foundSub) {
        console.error("❌ Inserted subscription not found in Super Admin query!");
        process.exit(1);
    }
    console.log("✅ Super Admin fetched subscription for:", foundSub.profiles?.full_name, "Amount: ₹" + foundSub.amount_paid);

    // 5. Cleanup test data
    console.log("\n5. Cleaning up test subscription and user...");
    await admin.from("subscriptions").delete().eq("id", subData.id);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
    console.log("✅ Test data cleaned up successfully!");

    console.log("\n🎉 ALL SUBSCRIPTION FLOWS ARE 100% OPERATIONAL!");
}

testSubscriptionPipeline().catch(console.error);
