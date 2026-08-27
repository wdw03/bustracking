import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkAdmin() {
    const { data: users } = await supabase.auth.admin.listUsers();
    console.log("Auth Users count:", users?.users?.length);
    const adminUser = users?.users?.find(u => u.phone === "+919826751348" || u.phone === "9826751348" || u.email?.includes("9826751348"));
    console.log("Admin Auth User:", adminUser ? { id: adminUser.id, email: adminUser.email, phone: adminUser.phone } : "NOT FOUND");

    if (adminUser) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", adminUser.id).single();
        console.log("Admin Profile:", prof);
    }
}

checkAdmin().catch(console.error);
