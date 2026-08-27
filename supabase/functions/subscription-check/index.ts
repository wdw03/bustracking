// ============================================================================
// BusTracker Edge Function: subscription-check
// Scheduled via Supabase Cron (daily)
// - Expires trials past 7 days
// - Expires paid subscriptions past paid_end
// - Sends expiry warning notifications (3 days before, 1 day before)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-signature, x-app-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results = {
      trials_expired: 0,
      subscriptions_expired: 0,
      warnings_3day: 0,
      warnings_1day: 0,
      errors: [] as string[],
    };

    // ════════════════════════════════════════════
    // 1. Expire trials past trial_end
    // ════════════════════════════════════════════
    const { data: expiredTrials, error: trialError } = await supabase
      .from("subscriptions")
      .select("id, user_id, trial_end")
      .eq("status", "trial")
      .lt("trial_end", new Date().toISOString());

    if (trialError) {
      results.errors.push(`Trial query error: ${trialError.message}`);
    } else if (expiredTrials && expiredTrials.length > 0) {
      for (const trial of expiredTrials) {
        // Update status to expired
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", trial.id);

        if (updateError) {
          results.errors.push(`Trial expire error for ${trial.id}: ${updateError.message}`);
          continue;
        }

        // Notify user
        await supabase.from("notifications").insert({
          user_id: trial.user_id,
          title: "⏰ Free Trial Expired",
          body: "Your 7-day free trial has ended. Subscribe now to continue tracking your child's bus!",
          type: "subscription",
          data: { action: "subscribe" },
        });

        results.trials_expired++;
      }
    }

    // ════════════════════════════════════════════
    // 2. Expire paid subscriptions past paid_end
    // ════════════════════════════════════════════
    const { data: expiredPaid, error: paidError } = await supabase
      .from("subscriptions")
      .select("id, user_id, paid_end")
      .eq("status", "active")
      .lt("paid_end", new Date().toISOString());

    if (paidError) {
      results.errors.push(`Paid query error: ${paidError.message}`);
    } else if (expiredPaid && expiredPaid.length > 0) {
      for (const sub of expiredPaid) {
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", sub.id);

        if (updateError) {
          results.errors.push(`Paid expire error for ${sub.id}: ${updateError.message}`);
          continue;
        }

        await supabase.from("notifications").insert({
          user_id: sub.user_id,
          title: "📋 Subscription Expired",
          body: "Your subscription has expired. Renew now to continue live bus tracking!",
          type: "subscription",
          data: { action: "renew" },
        });

        results.subscriptions_expired++;
      }
    }

    // ════════════════════════════════════════════
    // 3. Send 3-day expiry warning for trials
    // ════════════════════════════════════════════
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStart = new Date();
    threeDaysStart.setDate(threeDaysStart.getDate() + 2); // Between 2-3 days

    const { data: trialWarnings3 } = await supabase
      .from("subscriptions")
      .select("id, user_id, trial_end")
      .eq("status", "trial")
      .gte("trial_end", threeDaysStart.toISOString())
      .lt("trial_end", threeDaysFromNow.toISOString());

    if (trialWarnings3 && trialWarnings3.length > 0) {
      for (const sub of trialWarnings3) {
        // Check if we already sent a 3-day warning (prevent duplicates)
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", sub.user_id)
          .eq("type", "subscription")
          .contains("data", { warning: "3day" })
          .limit(1)
          .single();

        if (!existingNotif) {
          await supabase.from("notifications").insert({
            user_id: sub.user_id,
            title: "⚠️ Trial Ending Soon",
            body: "Your free trial ends in 3 days. Subscribe now for uninterrupted bus tracking!",
            type: "subscription",
            data: { action: "subscribe", warning: "3day" },
          });
          results.warnings_3day++;
        }
      }
    }

    // ════════════════════════════════════════════
    // 4. Send 1-day expiry warning
    // ════════════════════════════════════════════
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStart = new Date();

    // Trials expiring within 24 hours
    const { data: trialWarnings1 } = await supabase
      .from("subscriptions")
      .select("id, user_id, trial_end")
      .eq("status", "trial")
      .gte("trial_end", oneDayStart.toISOString())
      .lt("trial_end", oneDayFromNow.toISOString());

    // Paid subscriptions expiring within 24 hours
    const { data: paidWarnings1 } = await supabase
      .from("subscriptions")
      .select("id, user_id, paid_end")
      .eq("status", "active")
      .gte("paid_end", oneDayStart.toISOString())
      .lt("paid_end", oneDayFromNow.toISOString());

    const allWarnings1 = [...(trialWarnings1 || []), ...(paidWarnings1 || [])];

    for (const sub of allWarnings1) {
      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("type", "subscription")
        .contains("data", { warning: "1day" })
        .limit(1)
        .single();

      if (!existingNotif) {
        await supabase.from("notifications").insert({
          user_id: sub.user_id,
          title: "🔴 Expiring Tomorrow!",
          body: "Your access expires tomorrow! Renew now to keep tracking your child's bus.",
          type: "subscription",
          data: { action: "renew", warning: "1day" },
        });
        results.warnings_1day++;
      }
    }

    console.log("Subscription check results:", results);

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Subscription check error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
