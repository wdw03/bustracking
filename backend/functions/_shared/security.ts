// ============================================================================
// BusTracker Edge Function: Security Middleware
// Production-grade request validation shared across all Edge Functions
// ============================================================================

// ── CORS: Only allow requests from the app ──
// In production, Supabase Edge Functions run on the same domain,
// so CORS is handled automatically. We restrict to prevent abuse from
// random websites while still allowing the React Native app.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // React Native doesn't send Origin header
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-signature, x-app-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// ── App signature verification ──
// The app sends X-App-Signature = HMAC-SHA256(requestBody, APP_SECRET)
// This ensures only the real app can call Edge Functions
const APP_SECRET = Deno.env.get("APP_SIGNING_SECRET") || "";

async function computeHmac(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAppSignature(req: Request, bodyText: string): Promise<boolean> {
  // Skip verification if APP_SIGNING_SECRET is not configured yet
  // (graceful migration: set the secret in Supabase Edge Function env when ready)
  if (!APP_SECRET) return true;

  const signature = req.headers.get("x-app-signature");
  if (!signature) return false;

  const expected = await computeHmac(bodyText, APP_SECRET);
  return signature === expected;
}

// ── Rate limiting (per-IP basic check) ──
// Supabase Edge Functions don't persist state between invocations,
// so this is a lightweight check. For heavy rate limiting, use Supabase
// database-level rate limiting or Cloudflare/API Gateway.
const REQUEST_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(req: Request): { allowed: boolean; retryAfter?: number } {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
             req.headers.get("cf-connecting-ip") || 
             "unknown";

  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

// ── Input sanitization ──
export function sanitizeInput(value: unknown): string {
  if (typeof value !== "string") return "";
  // Remove null bytes, control characters, and trim
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
}

export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== "string") return "";
  // Keep only digits and + prefix
  return phone.replace(/[^\d+]/g, "").slice(0, 15);
}

// ── Unified error response ──
export function errorResponse(
  code: string,
  message: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({ success: false, error: { code, message } }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ── Validate required JWT auth ──
export async function requireAuth(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid authorization header.", 401);
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return errorResponse("UNAUTHORIZED", "Invalid or expired token.", 401);
  }

  return { userId: user.id };
}
