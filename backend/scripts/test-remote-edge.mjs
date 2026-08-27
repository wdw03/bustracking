import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aqknhfzktrsyndlgfcpy.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa25oZnprdHJzeW5kbGdmY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzEzNDEsImV4cCI6MjEwMTg0NzM0MX0.U_kZc7y3B4fJmXvUuJ4wP8tN_zQ9qF2xZ3eY9wK_mVo";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testRemoteEdgeFunction() {
    console.log("Calling remote register-user Edge Function with direct fetch...");
    const payload = {
        action: "register_school",
        schoolName: "Saransh Test",
        schoolPhone: "8789968980",
        schoolEmail: "hqsavan@gmail.com",
        adminName: "Dheeraj Kuame",
        adminMobile: "8789968980",
        adminEmail: "hqsavan@gmail.com",
        principalName: "Saransh Principal",
        address: "Haryana faridabad",
        city: "Siwan",
        state: "Bihar",
        postalCode: "121000",
        password: "Kumar@123",
    };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/register-user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify(payload),
    });

    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}

testRemoteEdgeFunction().catch(console.error);
