// ============================================================================
// BusTracker: Subscription Service
// Subscription status check + Google Play purchase verification
// ============================================================================

import { supabase } from "./supabase";
import type { ApiResult, SubscriptionStatusEnum, PlanType } from "./types";

// ── Subscription Info Type ──

export type SubscriptionInfo = {
  has_subscription: boolean;
  is_active: boolean;
  plan_type?: PlanType;
  status?: SubscriptionStatusEnum;
  trial_end?: string;
  paid_end?: string;
};

// ── Normalized type for UI consumption ──

export type SubscriptionDisplay = {
  status: "trial" | "active" | "expired" | "none";
  trial_days_left: number;
  plan_name: string | null;
  can_track: boolean;
  expires_at: string | null;
};

// ── Fetch Subscription Status (via RPC — server computes dates) ──

export async function getSubscriptionStatus(): Promise<SubscriptionInfo | null> {
  const { data, error } = await supabase.rpc("get_subscription_status");
  if (error || !data) return null;
  return data as SubscriptionInfo;
}

/** Convert raw subscription data to display-friendly format */
export function toSubscriptionDisplay(raw: SubscriptionInfo | null): SubscriptionDisplay {
  if (!raw || !raw.has_subscription) {
    return { status: "none", trial_days_left: 0, plan_name: null, can_track: false, expires_at: null };
  }

  let trialDaysLeft = 0;
  let expiresAt: string | null = null;
  let canTrack = raw.is_active;

  if (raw.status === "trial" && raw.trial_end) {
    const diff = new Date(raw.trial_end).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    expiresAt = raw.trial_end;
  } else if (raw.paid_end) {
    expiresAt = raw.paid_end;
  }

  const planNameMap: Record<string, string> = {
    free_trial: "Free Trial",
    monthly: "Monthly Plan",
    quarterly: "Quarterly Plan",
    yearly: "Yearly Plan",
  };

  return {
    status: raw.is_active ? (raw.status as any) || "active" : "expired",
    trial_days_left: trialDaysLeft,
    plan_name: raw.plan_type ? planNameMap[raw.plan_type] || raw.plan_type : null,
    can_track: canTrack,
    expires_at: expiresAt,
  };
}

// ── Google Play Purchase Verification ──

export async function verifyGooglePlayPurchase(
  purchaseToken: string,
  productId: string,
  orderId?: string
): Promise<ApiResult<any>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data, error } = await supabase.functions.invoke("google-play-webhook", {
    body: {
      action: "verify-purchase",
      user_id: user.id,
      purchase_token: purchaseToken,
      product_id: productId,
      order_id: orderId,
    },
  });

  if (error) return { success: false, error: "Payment verification failed." };
  return data;
}

// ── Subscription Plans List ──

export async function getSubscriptionPlans() {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("price");

  if (error || !data) return [];
  return data;
}
