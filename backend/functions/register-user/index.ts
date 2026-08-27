// ============================================================================
// BusTracker Edge Function: register-user
// Server-side registration for parents & drivers
// Validates phone against authorized_contacts (NEVER trust client)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-signature, x-app-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Parse request body ──
    const body = await req.json();
    const { action, phone, full_name, license_number, license_expiry, experience_years, relationship } = body;

    // Service role client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ════════════════════════════════════════════
    // ACTION: check_authorization (pre-login check)
    // ════════════════════════════════════════════
    if (action === "check_authorization") {
      const contactType = body.contact_type || "parent";

      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Missing phone." } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanDigits = phone.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("+") ? phone : `+91${cleanDigits.slice(-10)}`;
      const raw10 = cleanDigits.slice(-10);

      // 1. Check if phone is ALREADY registered in profiles table (active account)
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, phone, role, full_name, is_active")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .limit(1)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({
            success: false,
            authorized: false,
            error: {
              code: "ALREADY_REGISTERED",
              message: `This mobile number is already registered as a ${existingProfile.role?.replace("_", " ") || "user"}. Please log in directly.`,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. If checking for school registration:
      if (contactType === "school") {
        const { data: existingSchool } = await supabaseAdmin
          .from("schools")
          .select("id, name, status, phone")
          .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
          .limit(1)
          .maybeSingle();

        if (existingSchool) {
          return new Response(
            JSON.stringify({
              success: false,
              authorized: false,
              error: {
                code: "ALREADY_REGISTERED",
                message: `This mobile number is already registered for school "${existingSchool.name}" (Status: ${existingSchool.status}). Please log in.`,
              },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            authorized: true,
            data: { available: true },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. For parent & driver: Check authorized_contacts table
      const { data: contact } = await supabaseAdmin
        .from("authorized_contacts")
        .select("id, school_id, contact_type, is_registered")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .eq("contact_type", contactType)
        .limit(1)
        .maybeSingle();

      if (!contact) {
        return new Response(
          JSON.stringify({
            success: false,
            authorized: false,
            error: {
              code: "NOT_AUTHORIZED",
              message: contactType === "driver"
                ? "Drivers cannot self-register directly. Your mobile number has not been added by any School Administrator yet."
                : "Your mobile number is not registered with any school. Please contact your child's school administration.",
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (contact.is_registered) {
        return new Response(
          JSON.stringify({
            success: false,
            authorized: false,
            error: {
              code: "ALREADY_REGISTERED",
              message: "This mobile number is already registered. Please log in directly with your password.",
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check school is approved
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("id, name, status")
        .eq("id", contact.school_id)
        .eq("status", "approved")
        .single();

      if (!school) {
        return new Response(
          JSON.stringify({
            success: false,
            authorized: false,
            error: {
              code: "SCHOOL_NOT_APPROVED",
              message: "Your school is not yet approved on the platform.",
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          authorized: true,
          data: { school_name: school.name },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // ACTION: register_school (Public school registration)
    // ════════════════════════════════════════════
    if (action === "register_school") {
      const schoolName = body.school_name || body.schoolName;
      const schoolPhone = body.school_phone || body.schoolPhone || phone;
      const schoolEmail = body.school_email || body.schoolEmail;
      const adminName = body.admin_name || body.adminName || full_name;
      const adminMobile = body.admin_mobile || body.adminMobile || schoolPhone;
      const adminEmail = body.admin_email || body.adminEmail || schoolEmail;
      const principalName = body.principal_name || body.principalName;
      const principalPhone = body.principal_phone || body.principalPhone || schoolPhone;
      const address = body.address || "";
      const city = body.city || "";
      const state = body.state || "";
      const pincode = body.postal_code || body.postalCode || body.pincode || "";
      const password = body.password || "";

      if (!schoolName || (!schoolPhone && !adminMobile)) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Missing required school details." } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanDigits = (adminMobile || schoolPhone).replace(/\D/g, "");
      const raw10 = cleanDigits.slice(-10);
      const formattedPhone = (adminMobile || schoolPhone).startsWith("+")
        ? (adminMobile || schoolPhone)
        : `+91${raw10}`;

      // ── Duplicate Check 1: Check if school already registered with this phone ──
      const { data: existingSchool } = await supabaseAdmin
        .from("schools")
        .select("id, name, status, phone")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .limit(1)
        .maybeSingle();

      if (existingSchool) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "ALREADY_REGISTERED",
              message: `A school ("${existingSchool.name}") is already registered with this mobile number (Status: ${existingSchool.status}). You cannot register the same number twice.`,
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Duplicate Check 2: Check if phone already registered in profiles ──
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, phone, role, full_name")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .limit(1)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "ALREADY_REGISTERED",
              message: `This mobile number is already registered under role "${existingProfile.role}". Please log in directly or use a different number.`,
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let adminUserId: string | null = null;

      // Create Admin Auth account if password provided
      if (password && password.length >= 6) {
        const emailAlias = adminEmail && adminEmail.includes("@") ? adminEmail : `${cleanDigits}@bustracker.com`;

        // Check if user already exists in auth.users
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (u) => u.phone === formattedPhone || u.phone === cleanDigits || u.email === emailAlias
        );

        if (existing) {
          adminUserId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(adminUserId, {
            password,
            user_metadata: { full_name: adminName || schoolName, role: "school_admin" },
          });
        } else {
          const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
            phone: formattedPhone,
            email: emailAlias,
            password,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: { full_name: adminName || schoolName, role: "school_admin" },
          });

          if (!createAuthError && newUser?.user) {
            adminUserId = newUser.user.id;
          }
        }

        // Upsert profile as school_admin (is_active: false until approved by Super Admin)
        if (adminUserId) {
          await supabaseAdmin.from("profiles").upsert({
            id: adminUserId,
            phone: formattedPhone,
            full_name: adminName || schoolName,
            role: "school_admin",
            is_active: false,
          }, { onConflict: "id" });
        }
      }

      // Insert into schools table (status = 'pending')
      const { data: school, error: schoolError } = await supabaseAdmin
        .from("schools")
        .insert({
          name: schoolName,
          phone: formattedPhone,
          email: schoolEmail || adminEmail || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          principal_name: principalName || null,
          principal_phone: principalPhone || null,
          admin_user_id: adminUserId,
          status: "pending",
        })
        .select()
        .single();

      if (schoolError) {
        console.error("register_school error:", schoolError);
        return new Response(
          JSON.stringify({ success: false, error: { code: "DB_ERROR", message: schoolError.message } }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If admin user was created, link in school_members (is_active: false until approved)
      if (adminUserId && school) {
        await supabaseAdmin.from("school_members").upsert({
          school_id: school.id,
          user_id: adminUserId,
          role: "school_admin",
          is_active: false,
        });
      }

      // Add audit log
      await supabaseAdmin.from("audit_logs").insert({
        actor_user_id: adminUserId,
        action: "school_registered",
        entity_type: "school",
        entity_id: school.id,
        metadata: { school_name: school.name, city: school.city },
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            school_id: school.id,
            name: school.name,
            status: "pending",
          },
          message: "School registration request submitted successfully! Awaiting Super Admin review.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── For register_parent & register_driver: require authenticated user ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Missing authorization header." } }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid session." } }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!action || !phone || !full_name) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Missing required fields: action, phone, full_name." } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // ACTION: register_parent
    // ════════════════════════════════════════════
    if (action === "register_parent") {
      const cleanDigits = phone.replace(/\D/g, "");
      const raw10 = cleanDigits.slice(-10);
      const formattedPhone = phone.startsWith("+") ? phone : `+91${raw10}`;

      // Check if another profile already has this phone
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, role, full_name")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .limit(1)
        .maybeSingle();

      if (existingProfile && existingProfile.id !== user.id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "ALREADY_REGISTERED",
              message: "This mobile number is already registered to another account.",
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Server-side call to database function (all validation inside PostgreSQL)
      const { data, error } = await supabaseAdmin.rpc("register_parent", {
        p_phone: formattedPhone,
        p_full_name: full_name,
      });

      if (error) {
        console.error("register_parent error:", error);
        return new Response(
          JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Registration failed." } }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // ACTION: register_driver
    // ════════════════════════════════════════════
    if (action === "register_driver") {
      const cleanDigits = phone.replace(/\D/g, "");
      const raw10 = cleanDigits.slice(-10);
      const formattedPhone = phone.startsWith("+") ? phone : `+91${raw10}`;

      // Check if another profile already has this phone
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, role, full_name")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .limit(1)
        .maybeSingle();

      if (existingProfile && existingProfile.id !== user.id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "ALREADY_REGISTERED",
              message: "This mobile number is already registered to another account.",
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabaseAdmin.rpc("register_driver", {
        p_phone: formattedPhone,
        p_full_name: full_name,
        p_license_number: license_number || null,
        p_license_expiry: license_expiry || null,
        p_experience_years: experience_years || 0,
      });

      if (error) {
        console.error("register_driver error:", error);
        return new Response(
          JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Registration failed." } }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: `Unknown action: ${action}` } }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
