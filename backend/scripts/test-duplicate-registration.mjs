import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzEzNDEsImV4cCI6MjEwMTg0NzM0MX0.9ETxdL2W8O09B0-z5Jq09dDU1JblgdT0YUUGGdXaU3Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("==========================================================");
console.log("🧪 TESTING DUPLICATE PHONE REGISTRATION PREVENTION");
console.log("==========================================================");

async function run() {
  // Test 1: Check authorization with an existing super admin phone (9826751348)
  console.log("\n1. Testing check_authorization for existing phone (9826751348)...");
  const { data: checkRes } = await supabase.functions.invoke("register-user", {
    body: {
      action: "check_authorization",
      phone: "9826751348",
      contact_type: "school",
    },
  });
  console.log("Result:", JSON.stringify(checkRes, null, 2));
  if (!checkRes.authorized && (checkRes.error?.code === "ALREADY_REGISTERED" || checkRes.error?.message?.includes("already registered"))) {
    console.log("✅ [PASS] Duplicate phone correctly blocked in check_authorization!");
  } else {
    console.error("❌ [FAIL] Did not block duplicate phone in check_authorization!");
  }

  // Test 2: Attempt register_school with existing phone
  console.log("\n2. Testing register_school with existing phone (9826751348)...");
  const { data: regRes, error: regErr } = await supabase.functions.invoke("register-user", {
    body: {
      action: "register_school",
      schoolName: "Duplicate Test School",
      schoolPhone: "9826751348",
      adminMobile: "9826751348",
      password: "TestPassword@123",
    },
  });
  console.log("Data:", JSON.stringify(regRes, null, 2));
  console.log("Error:", JSON.stringify(regErr, null, 2));
  if (regErr || (regRes && !regRes.success)) {
    console.log("✅ [PASS] Duplicate school registration correctly blocked!");
  } else {
    console.error("❌ [FAIL] Did not block duplicate school registration!");
  }

  console.log("\n==========================================================");
  console.log("🎉 ALL DUPLICATE REGISTRATION PREVENTION CHECKS COMPLETED!");
  console.log("==========================================================");
}

run().catch(console.error);
