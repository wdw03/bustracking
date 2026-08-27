import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI3MTM0MSwiZXhwIjoyMTAxODQ3MzQxfQ.MbuAPoWdu0H3jSO7tm3LXBdG4mj4sr_uTPxhb776ePM";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Step 1: Create exec_raw_sql helper function first
const createHelper = `
CREATE OR REPLACE FUNCTION exec_raw_sql(sql_text TEXT)
RETURNS void AS $func$
BEGIN
    EXECUTE sql_text;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// Step 2: SQL statements to run
const stmts = [
    `CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        requested_by UUID REFERENCES profiles(id),
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        bank_name TEXT,
        account_number TEXT,
        ifsc_code TEXT,
        account_holder TEXT,
        upi_id TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
        rejection_reason TEXT,
        processed_by UUID REFERENCES profiles(id),
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_withdrawal_school ON withdrawal_requests(school_id)`,
    `CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status)`,
    `ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY withdrawal_super_admin_all ON withdrawal_requests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))`,
    `CREATE POLICY withdrawal_school_admin_select ON withdrawal_requests FOR SELECT USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.school_id = withdrawal_requests.school_id AND sm.is_active = true))`,
    `CREATE POLICY withdrawal_school_admin_insert ON withdrawal_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.school_id = withdrawal_requests.school_id AND sm.is_active = true))`,
];

async function run() {
    // First try to create helper via Management API
    const mgmtUrl = `https://aqknhfzktrsyndlgfcpy.supabase.co/pg/query`;
    
    // Try using Supabase's SQL endpoint (requires project ref)
    // Alternative: try fetch to the database directly
    
    // Method 1: Try to execute via fetch to pg/query
    try {
        const res = await fetch("https://aqknhfzktrsyndlgfcpy.supabase.co/rest/v1/rpc/exec_raw_sql", {
            method: "POST",
            headers: {
                apikey: SERVICE_KEY,
                Authorization: `Bearer ${SERVICE_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sql_text: "SELECT 1" }),
        });
        
        if (res.status === 404) {
            console.log("exec_raw_sql RPC not found. Need to create it first.");
            console.log("Attempting alternative approach...");
        } else if (res.ok) {
            console.log("RPC helper exists! Running migration...");
            
            for (const stmt of stmts) {
                const r = await fetch("https://aqknhfzktrsyndlgfcpy.supabase.co/rest/v1/rpc/exec_raw_sql", {
                    method: "POST",
                    headers: {
                        apikey: SERVICE_KEY,
                        Authorization: `Bearer ${SERVICE_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ sql_text: stmt }),
                });
                
                if (r.ok) {
                    console.log(`✅ ${stmt.slice(0, 50)}...`);
                } else {
                    const err = await r.text();
                    console.log(`⚠️ ${stmt.slice(0, 50)}... -> ${err.slice(0, 100)}`);
                }
            }
        }
    } catch (e) {
        console.log("Fetch error:", e.message);
    }
    
    // Verify
    const { data, error } = await supabase.from("withdrawal_requests").select("id").limit(1);
    if (!error) {
        console.log("\n✅ SUCCESS! withdrawal_requests table exists.");
    } else {
        console.log("\n⚠️ Table not created yet. Error:", error.message);
        console.log("\n📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:");
        console.log("   URL: https://supabase.com/dashboard/project/aqknhfzktrsyndlgfcpy/sql/new\n");
        
        for (const stmt of stmts) {
            console.log(stmt + ";\n");
        }
    }
}

run();
