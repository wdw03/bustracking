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
        const emailAlias = `${raw10}@bustracker.com`;

        // Check if user already exists in auth.users
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (u) => u.phone === formattedPhone || u.phone === cleanDigits || u.phone === `91${raw10}` || u.email === emailAlias || (adminEmail && u.email === adminEmail)
        );

        if (existing) {
          adminUserId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(adminUserId, {
            password,
            email: emailAlias,
            email_confirm: true,
            user_metadata: { full_name: adminName || schoolName, role: "school_admin", admin_email: adminEmail || null },
          });
        } else {
          const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
            phone: formattedPhone,
            email: emailAlias,
            password,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: { full_name: adminName || schoolName, role: "school_admin", admin_email: adminEmail || null },
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

    // ════════════════════════════════════════════
    // ACTION: approve_school (Super Admin privileged approval)
    // ════════════════════════════════════════════
    if (action === "approve_school") {
      const { school_id } = body;
      if (!school_id) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Missing school_id." } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Update school status to 'approved'
      const { data: school, error: schoolErr } = await supabaseAdmin
        .from("schools")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", school_id)
        .select()
        .single();

      if (schoolErr || !school) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "DB_ERROR", message: schoolErr?.message || "School not found." } }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Activate school members
      await supabaseAdmin
        .from("school_members")
        .update({ is_active: true })
        .eq("school_id", school_id);

      // 3. Activate school admin profile
      if (school.admin_user_id) {
        await supabaseAdmin
          .from("profiles")
          .update({ is_active: true })
          .eq("id", school.admin_user_id);
      } else if (school.phone) {
        const cleanDigits = school.phone.replace(/\D/g, "");
        const raw10 = cleanDigits.slice(-10);
        const formattedPhone = school.phone.startsWith("+") ? school.phone : `+91${raw10}`;
        await supabaseAdmin
          .from("profiles")
          .update({ is_active: true })
          .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`);
      }

      // 4. Insert audit log
      await supabaseAdmin.from("audit_logs").insert({
        action: "school_approved",
        entity_type: "school",
        entity_id: school_id,
        metadata: { school_name: school.name, approved_at: new Date().toISOString() },
      });

      return new Response(
        JSON.stringify({ success: true, message: "School approved and admin activated." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // ACTION: reset_password (Update password for verified phone)
    // ════════════════════════════════════════════
    if (action === "reset_password") {
      const { password: newPassword } = body;
      if (!phone || !newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Missing phone or invalid password (min 6 characters)." } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanDigits = phone.replace(/\D/g, "");
      const raw10 = cleanDigits.slice(-10);
      const formattedPhone = phone.startsWith("+") ? phone : `+91${raw10}`;
      const emailAlias = `${raw10}@bustracker.com`;

      // Find user in auth.users
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      let targetUser = usersData?.users?.find(
        (u) => u.phone === formattedPhone || u.phone === cleanDigits || u.phone === `91${raw10}` || u.email === emailAlias
      );

      // If not found in listUsers, check profiles table
      if (!targetUser) {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
          .limit(1)
          .maybeSingle();

        if (prof?.id) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(prof.id);
          if (authUser?.user) {
            targetUser = authUser.user;
          }
        }
      }

      if (!targetUser) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "USER_NOT_FOUND", message: "Account not found for this mobile number." } }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update user password and ensure email alias is set
      const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        password: newPassword,
        email: emailAlias,
        email_confirm: true,
      });

      if (updateAuthErr) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "UPDATE_FAILED", message: updateAuthErr.message } }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // ACTION: check_phone_exists (Check if account exists for Forgot Password)
    // ════════════════════════════════════════════
    if (action === "check_phone_exists") {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Missing phone." } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanDigits = phone.replace(/\D/g, "");
      const raw10 = cleanDigits.slice(-10);
      const formattedPhone = phone.startsWith("+") ? phone : `+91${raw10}`;

      // Check profiles or schools
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, role, is_active")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .limit(1)
        .maybeSingle();

      if (prof) {
        return new Response(
          JSON.stringify({ success: true, exists: true, name: prof.full_name, role: prof.role }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("id, name, status")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .limit(1)
        .maybeSingle();

      if (school) {
        return new Response(
          JSON.stringify({ success: true, exists: true, name: school.name, role: "school_admin" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, exists: false, error: { code: "NOT_FOUND", message: "No account found with this mobile number." } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // ACTION: register_parent
    // ════════════════════════════════════════════
    if (action === "register_parent") {
      if (!phone || !full_name) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Missing phone or full_name." } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanDigits = phone.replace(/\D/g, "");
      const raw10 = cleanDigits.slice(-10);
      const formattedPhone = phone.startsWith("+") ? phone : `+91${raw10}`;
      const emailAlias = `${raw10}@bustracker.com`;
      const password = body.password || "Kumar@123";
      const relation = body.relation || "guardian";

      // 1. Check authorized_contacts table
      const { data: contacts, error: contactError } = await supabaseAdmin
        .from("authorized_contacts")
        .select("*")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .eq("contact_type", "parent");

      if (contactError || !contacts || contacts.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_AUTHORIZED",
              message: "Your mobile number is not authorized by the school. Please contact your child's school.",
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const schoolId = contacts[0].school_id;

      // 2. Check school is approved
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("id, name, status")
        .eq("id", schoolId)
        .eq("status", "approved")
        .maybeSingle();

      if (!school) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "SCHOOL_NOT_APPROVED",
              message: "Your school is not yet approved on the platform.",
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Create or update auth user in Supabase Auth
      let parentUserId: string;
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        (u) => u.phone === formattedPhone || u.phone === cleanDigits || u.phone === `91${raw10}` || u.email === emailAlias
      );

      if (existing) {
        parentUserId = existing.id;
        await supabaseAdmin.auth.admin.updateUserById(parentUserId, {
          password,
          email: emailAlias,
          email_confirm: true,
          user_metadata: { full_name, role: "parent" },
        });
      } else {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          phone: formattedPhone,
          email: emailAlias,
          password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { full_name, role: "parent" },
        });

        if (createError || !newUser?.user) {
          console.error("Create parent auth user error:", createError);
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: "AUTH_ERROR", message: createError?.message || "Failed to create user account." },
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        parentUserId = newUser.user.id;
      }

      // 4. Upsert profile table
      await supabaseAdmin.from("profiles").upsert({
        id: parentUserId,
        phone: formattedPhone,
        full_name,
        role: "parent",
        is_active: true,
      }, { onConflict: "id" });

      // 5. Link all children from authorized_contacts to child_parents
      let childrenLinked = 0;
      for (const contact of contacts) {
        if (contact.child_id) {
          await supabaseAdmin.from("child_parents").upsert({
            child_id: contact.child_id,
            parent_user_id: parentUserId,
            relationship: relation ? relation.toLowerCase() : "guardian",
            is_primary: true,
          }, { onConflict: "child_id,parent_user_id" });
          childrenLinked++;
        }
        await supabaseAdmin.from("authorized_contacts").update({
          is_registered: true,
          updated_at: new Date().toISOString(),
        }).eq("id", contact.id);
      }

      // 6. Create 7-day free trial in subscriptions table
      await supabaseAdmin.from("subscriptions").upsert({
        user_id: parentUserId,
        school_id: schoolId,
        plan_type: "free_trial",
        status: "trial",
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "user_id,school_id" });

      // 7. Audit log
      await supabaseAdmin.from("audit_logs").insert({
        actor_user_id: parentUserId,
        school_id: schoolId,
        action: "register_parent",
        entity_type: "profile",
        entity_id: parentUserId,
        metadata: { phone: formattedPhone, full_name, children_linked: childrenLinked },
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            user_id: parentUserId,
            school_id: school.id,
            school_name: school.name,
            children_linked: childrenLinked,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // ACTION: register_driver
    // ════════════════════════════════════════════
    if (action === "register_driver") {
      if (!phone || !full_name) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Missing phone or full_name." } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanDigits = phone.replace(/\D/g, "");
      const raw10 = cleanDigits.slice(-10);
      const formattedPhone = phone.startsWith("+") ? phone : `+91${raw10}`;
      const emailAlias = `${raw10}@bustracker.com`;
      const password = body.password || "Kumar@123";

      // 1. Check authorized_contacts table
      const { data: contacts, error: contactError } = await supabaseAdmin
        .from("authorized_contacts")
        .select("*")
        .or(`phone.eq.${formattedPhone},phone.eq.${cleanDigits},phone.eq.${raw10}`)
        .eq("contact_type", "driver");

      if (contactError || !contacts || contacts.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_AUTHORIZED",
              message: "Your mobile number has not been added by any school as a driver.",
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const schoolId = contacts[0].school_id;

      // 2. Check school is approved
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("id, name, status")
        .eq("id", schoolId)
        .eq("status", "approved")
        .maybeSingle();

      if (!school) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "SCHOOL_NOT_APPROVED",
              message: "Your school is not yet approved on the platform.",
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Create or update auth user in Supabase Auth
      let driverUserId: string;
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        (u) => u.phone === formattedPhone || u.phone === cleanDigits || u.phone === `91${raw10}` || u.email === emailAlias
      );

      if (existing) {
        driverUserId = existing.id;
        await supabaseAdmin.auth.admin.updateUserById(driverUserId, {
          password,
          email: emailAlias,
          email_confirm: true,
          user_metadata: { full_name, role: "driver" },
        });
      } else {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          phone: formattedPhone,
          email: emailAlias,
          password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { full_name, role: "driver" },
        });

        if (createError || !newUser?.user) {
          console.error("Create driver auth user error:", createError);
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: "AUTH_ERROR", message: createError?.message || "Failed to create driver account." },
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        driverUserId = newUser.user.id;
      }

      // 4. Upsert profile table
      await supabaseAdmin.from("profiles").upsert({
        id: driverUserId,
        phone: formattedPhone,
        full_name,
        role: "driver",
        is_active: true,
      }, { onConflict: "id" });

      // 5. Upsert driver record in drivers table
      await supabaseAdmin.from("drivers").upsert({
        school_id: schoolId,
        user_id: driverUserId,
        license_number: license_number || null,
        license_expiry: license_expiry || null,
        experience_years: experience_years || 0,
        is_active: true,
      }, { onConflict: "user_id" });

      // 6. Mark authorized_contacts as registered
      for (const contact of contacts) {
        await supabaseAdmin.from("authorized_contacts").update({
          is_registered: true,
          updated_at: new Date().toISOString(),
        }).eq("id", contact.id);
      }

      // 7. Audit log
      await supabaseAdmin.from("audit_logs").insert({
        actor_user_id: driverUserId,
        school_id: schoolId,
        action: "register_driver",
        entity_type: "profile",
        entity_id: driverUserId,
        metadata: { phone: formattedPhone, full_name },
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            user_id: driverUserId,
            school_id: school.id,
            school_name: school.name,
          },
        }),
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
