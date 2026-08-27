-- ============================================================================
-- BusTracker: 010_seed.sql
-- Development seed data
-- ============================================================================

-- ────────────────────────────────────────────
-- Subscription Plans (managed by Super Admin)
-- ────────────────────────────────────────────
INSERT INTO subscription_plans (name, price, currency, duration_days, google_product_id, is_active, features)
VALUES
  (
    'Monthly',
    99.00,
    'INR',
    30,
    'com.bustracker.monthly',
    true,
    '["Live bus tracking", "Push notifications", "Trip history", "1km proximity alerts"]'::jsonb
  ),
  (
    'Quarterly',
    249.00,
    'INR',
    90,
    'com.bustracker.quarterly',
    true,
    '["Live bus tracking", "Push notifications", "Trip history", "1km proximity alerts", "Priority support"]'::jsonb
  ),
  (
    'Yearly',
    799.00,
    'INR',
    365,
    'com.bustracker.yearly',
    true,
    '["Live bus tracking", "Push notifications", "Trip history", "1km proximity alerts", "Priority support", "Family discount"]'::jsonb
  )
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────
-- NOTE: Super Admin user setup
-- ────────────────────────────────────────────
-- The Super Admin is created by:
-- 1. Sign up via Supabase Auth (phone OTP or email)
-- 2. Manually set role in profiles table:
--
--    UPDATE profiles SET role = 'super_admin' WHERE phone = '+919826751348';
--
-- OR use Supabase Dashboard → Authentication → Users → find user → edit raw_user_meta_data
-- This ensures NO hardcoded admin credentials exist in code.
-- NEVER expose super admin creation to any API endpoint.
