// ============================================================================
// BusTracker: Database Seed Script
// Seeds default subscription plans and initial configurations into Supabase
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seed() {
  console.log("🌱 Seeding Supabase database with default subscription plans...");

  const plans = [
    {
      name: "Monthly",
      price: 99.00,
      currency: "INR",
      duration_days: 30,
      google_product_id: "com.bustracker.monthly",
      is_active: true,
      features: ["Live bus tracking", "Push notifications", "Trip history", "1km proximity alerts"],
    },
    {
      name: "Quarterly",
      price: 249.00,
      currency: "INR",
      duration_days: 90,
      google_product_id: "com.bustracker.quarterly",
      is_active: true,
      features: ["Live bus tracking", "Push notifications", "Trip history", "1km proximity alerts", "Priority support"],
    },
    {
      name: "Yearly",
      price: 799.00,
      currency: "INR",
      duration_days: 365,
      google_product_id: "com.bustracker.yearly",
      is_active: true,
      features: ["Live bus tracking", "Push notifications", "Trip history", "1km proximity alerts", "Priority support", "Family discount"],
    },
  ];

  for (const plan of plans) {
    const { data, error } = await supabase
      .from("subscription_plans")
      .upsert(plan, { onConflict: "google_product_id" })
      .select();

    if (error) {
      console.error(`❌ Failed to insert plan ${plan.name}:`, error.message);
    } else {
      console.log(`✅ Plan ready: ${plan.name} (₹${plan.price})`);
    }
  }

  console.log("✨ Seeding completed!");
}

seed();
