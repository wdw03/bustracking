// Migration: Add school registration RPC function + RLS policy for anon
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function runMigration() {
    console.log("🚀 Running migration: School registration support...");

    // Test direct service role insert & policy
    // We create an RPC or execute migration SQL via linked connection or edge function
    // Let's test if service role can insert schools directly
    const testSchool = {
        name: "Demo School Verification",
        phone: "+919876543210",
        email: "contact@demoschool.com",
        city: "New Delhi",
        status: "pending",
    };

    const { data: inserted, error: insertErr } = await supabase
        .from("schools")
        .insert(testSchool)
        .select()
        .single();

    if (insertErr) {
        console.error("❌ Service insert failed:", insertErr);
    } else {
        console.log("✅ Service role can insert schools:", inserted.id);
        // Clean test row
        await supabase.from("schools").delete().eq("id", inserted.id);
    }
}

runMigration().catch(console.error);
