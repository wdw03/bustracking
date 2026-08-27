// ============================================================================
// BusTracker Edge Function: send-notification
// Server-side push notification delivery
// App NEVER sends notifications directly — only this function does
// Push credentials stored in Supabase Secrets, not in client app
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

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: string;
  data?: Record<string, unknown>;
  channelId?: string;
  priority?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // ── Single notification ──
    if (body.user_id) {
      const result = await sendNotification(supabase, body as NotificationPayload);
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Batch notifications (array) ──
    if (Array.isArray(body.notifications)) {
      const results = [];
      for (const notif of body.notifications) {
        const result = await sendNotification(supabase, notif);
        results.push(result);
      }
      return new Response(
        JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Webhook-triggered notification (from DB trigger) ──
    if (body.record && body.table === "notifications") {
      const record = body.record;
      // Send push for newly created notification
      await sendPushToUser(supabase, record.user_id, {
        title: record.title,
        body: record.body,
        data: record.data,
      });
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid payload." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Send notification error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


// ── Send notification + push for a single user ──
async function sendNotification(
  supabase: ReturnType<typeof createClient>,
  payload: NotificationPayload
) {
  const { user_id, title, body, type, data } = payload;

  if (!user_id || !title || !body) {
    return { success: false, error: "Missing user_id, title, or body." };
  }

  // Store notification in DB (history)
  const { error: insertError } = await supabase.from("notifications").insert({
    user_id,
    title,
    body,
    type: type || "system",
    data: data || {},
    is_read: false,
  });

  if (insertError) {
    console.error("Notification insert error:", insertError);
    return { success: false, error: "Failed to store notification." };
  }

  // Send push
  const pushResult = await sendPushToUser(supabase, user_id, { title, body, data });

  return {
    success: true,
    user_id,
    push_sent: pushResult.sent,
    push_count: pushResult.count,
  };
}


// ── Send push notification via Expo Push API ──
async function sendPushToUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  message: { title: string; body: string; data?: Record<string, unknown> }
) {
  // Get active push tokens for user
  const { data: tokens, error: tokenError } = await supabase
    .from("push_tokens")
    .select("token, platform")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (tokenError || !tokens || tokens.length === 0) {
    return { sent: false, count: 0 };
  }

  const pushMessages: ExpoPushMessage[] = tokens.map((t: { token: string }) => ({
    to: t.token,
    title: message.title,
    body: message.body,
    sound: "default",
    data: message.data,
    channelId: "bus-alerts",
    priority: "high",
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(Deno.env.get("EXPO_PUSH_ACCESS_TOKEN")
          ? { Authorization: `Bearer ${Deno.env.get("EXPO_PUSH_ACCESS_TOKEN")}` }
          : {}),
      },
      body: JSON.stringify(pushMessages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Expo Push API error:", errorText);
      return { sent: false, count: 0 };
    }

    const result = await response.json();

    // Deactivate invalid tokens
    if (result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          // Mark token as inactive
          await supabase
            .from("push_tokens")
            .update({ is_active: false })
            .eq("token", pushMessages[i].to)
            .eq("user_id", userId);
        }
      }
    }

    return { sent: true, count: pushMessages.length };
  } catch (err) {
    console.error("Push send error:", err);
    return { sent: false, count: 0 };
  }
}
