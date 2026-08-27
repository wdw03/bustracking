-- ============================================================================
-- BusTracker: 001_extensions.sql
-- Enable required PostgreSQL extensions
-- ============================================================================

-- PostGIS: geographic distance calculations (1km proximity via ST_DWithin)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- pgcrypto: gen_random_uuid() for UUID primary keys
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- moddatetime: auto-update updated_at columns
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;
-- ============================================================================
-- BusTracker: 002_enums.sql
-- Custom ENUM types for role-based access, statuses, and categorization
-- ============================================================================

-- User roles (set server-side ONLY, never by client)
CREATE TYPE user_role AS ENUM ('super_admin', 'school_admin', 'parent', 'driver');

-- School approval lifecycle
CREATE TYPE school_status AS ENUM ('pending', 'approved', 'rejected', 'blocked');

-- Authorized contact category
CREATE TYPE contact_type AS ENUM ('parent', 'driver');

-- Subscription lifecycle
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');

-- Subscription plan type
CREATE TYPE plan_type AS ENUM ('free_trial', 'monthly', 'quarterly', 'yearly');

-- Trip direction
CREATE TYPE trip_type AS ENUM ('pickup', 'drop');

-- Trip lifecycle
CREATE TYPE trip_status AS ENUM ('in_progress', 'completed', 'cancelled');

-- Notification categories
CREATE TYPE notification_type AS ENUM (
  'bus_nearby',
  'subscription',
  'system',
  'school_update',
  'trip_started',
  'trip_ended'
);

-- Push token platform
CREATE TYPE platform_type AS ENUM ('android', 'ios', 'web');
-- ============================================================================
-- BusTracker: 003_tables.sql
-- All 18 production tables
-- Uses UUID PKs, timestamptz, foreign keys, CHECK/UNIQUE constraints
-- ============================================================================

SET search_path = public, extensions;

-- ──────────────────────────────────────────────
-- 1. profiles (linked to auth.users)
-- ──────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'parent',
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE profiles IS 'Public user profile. ID = auth.users.id. Role is set server-side only.';

-- ──────────────────────────────────────────────
-- 2. schools
-- ──────────────────────────────────────────────
CREATE TABLE schools (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  admin_user_id     UUID REFERENCES profiles(id),
  phone             TEXT NOT NULL,
  email             TEXT,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  pincode           TEXT,
  principal_name    TEXT,
  principal_phone   TEXT,
  gst_number        TEXT,
  website           TEXT,
  logo_url          TEXT,
  status            school_status NOT NULL DEFAULT 'pending',
  approved_by       UUID REFERENCES profiles(id),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE schools IS 'School registration. Status managed by Super Admin only.';

-- ──────────────────────────────────────────────
-- 3. school_members (future scalability)
-- ──────────────────────────────────────────────
CREATE TABLE school_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'school_admin',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, user_id)
);
COMMENT ON TABLE school_members IS 'Multi-role school membership. Prevents cross-school access.';

-- ──────────────────────────────────────────────
-- 4. buses
-- ──────────────────────────────────────────────
CREATE TABLE buses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  bus_number  TEXT NOT NULL,
  route_name  TEXT,
  capacity    INTEGER CHECK (capacity > 0),
  model       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, bus_number)
);
COMMENT ON TABLE buses IS 'Bus fleet. Each bus belongs to exactly one school.';

-- ──────────────────────────────────────────────
-- 5. children
-- ──────────────────────────────────────────────
CREATE TABLE children (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  class             TEXT,
  section           TEXT,
  roll_number       TEXT,
  pickup_address    TEXT,
  pickup_lat        DOUBLE PRECISION,
  pickup_lng        DOUBLE PRECISION,
  pickup_location   extensions.geography(POINT, 4326),
  assigned_bus_id   UUID REFERENCES buses(id) ON DELETE SET NULL,
  photo_url         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE children IS 'Student records. pickup_location is PostGIS GEOGRAPHY for server-side proximity.';

-- ──────────────────────────────────────────────
-- 6. authorized_contacts
-- ──────────────────────────────────────────────
CREATE TABLE authorized_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL,
  contact_type  contact_type NOT NULL,
  child_id      UUID REFERENCES children(id) ON DELETE SET NULL,
  is_registered BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, phone, contact_type)
);
COMMENT ON TABLE authorized_contacts IS 'School-authorized phone numbers. Registration checks this server-side.';

-- ──────────────────────────────────────────────
-- 7. child_parents (many-to-many)
-- ──────────────────────────────────────────────
CREATE TABLE child_parents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship    TEXT NOT NULL DEFAULT 'guardian'
                  CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, parent_user_id)
);
COMMENT ON TABLE child_parents IS 'Parent-child linking. Supports multiple parents per child.';

-- ──────────────────────────────────────────────
-- 8. drivers
-- ──────────────────────────────────────────────
CREATE TABLE drivers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  assigned_bus_id   UUID REFERENCES buses(id) ON DELETE SET NULL,
  license_number    TEXT,
  license_expiry    DATE,
  experience_years  INTEGER DEFAULT 0 CHECK (experience_years >= 0),
  rating            NUMERIC(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE drivers IS 'Driver profiles. assigned_bus_id validated server-side.';

-- ──────────────────────────────────────────────
-- 9. bus_live_locations (UPSERT only, Realtime)
-- ──────────────────────────────────────────────
CREATE TABLE bus_live_locations (
  bus_id      UUID PRIMARY KEY REFERENCES buses(id) ON DELETE CASCADE,
  driver_id   UUID REFERENCES drivers(id) ON DELETE SET NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  location    extensions.geography(POINT, 4326),
  speed       NUMERIC(5,2) DEFAULT 0,
  heading     NUMERIC(5,2) DEFAULT 0,
  accuracy    NUMERIC(8,2),
  is_live     BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE bus_live_locations IS 'Current bus position. ONE row per bus, UPSERT only. Realtime enabled.';

-- ──────────────────────────────────────────────
-- 10. trips
-- ──────────────────────────────────────────────
CREATE TABLE trips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id      UUID NOT NULL REFERENCES buses(id),
  driver_id   UUID NOT NULL REFERENCES drivers(id),
  school_id   UUID NOT NULL REFERENCES schools(id),
  trip_type   trip_type NOT NULL,
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  status      trip_status NOT NULL DEFAULT 'in_progress',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE trips IS 'Trip records. start_trip() function validates driver/bus/school.';

-- ──────────────────────────────────────────────
-- 11. trip_locations (historical GPS, separate from live)
-- ──────────────────────────────────────────────
CREATE TABLE trip_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  speed       NUMERIC(5,2),
  heading     NUMERIC(5,2),
  accuracy    NUMERIC(8,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE trip_locations IS 'Historical GPS points for trip replay. NOT for live tracking.';

-- ──────────────────────────────────────────────
-- 12. bus_stops
-- ──────────────────────────────────────────────
CREATE TABLE bus_stops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id          UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  stop_name       TEXT NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  location        extensions.geography(POINT, 4326),
  stop_order      INTEGER NOT NULL CHECK (stop_order >= 0),
  scheduled_time  TIME,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE bus_stops IS 'Route stops with ordering and PostGIS location.';

-- ──────────────────────────────────────────────
-- 13. subscription_plans (Super Admin managed)
-- ──────────────────────────────────────────────
CREATE TABLE subscription_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  price             NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency          TEXT NOT NULL DEFAULT 'INR',
  duration_days     INTEGER NOT NULL CHECK (duration_days > 0),
  features          JSONB DEFAULT '[]'::jsonb,
  google_product_id TEXT UNIQUE,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE subscription_plans IS 'Subscription plans managed by Super Admin.';

-- ──────────────────────────────────────────────
-- 14. subscriptions
-- ──────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id             UUID REFERENCES schools(id),
  plan_id               UUID REFERENCES subscription_plans(id),
  plan_type             plan_type NOT NULL DEFAULT 'free_trial',
  status                subscription_status NOT NULL DEFAULT 'trial',
  trial_start           TIMESTAMPTZ,
  trial_end             TIMESTAMPTZ,
  paid_start            TIMESTAMPTZ,
  paid_end              TIMESTAMPTZ,
  google_play_order_id  TEXT UNIQUE,
  google_purchase_token TEXT,
  amount_paid           NUMERIC(10,2) DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE subscriptions IS 'User subscriptions. Client CANNOT set trial_end/paid_end/status.';

-- ──────────────────────────────────────────────
-- 15. push_tokens
-- ──────────────────────────────────────────────
CREATE TABLE push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    platform_type NOT NULL,
  device_id   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);
COMMENT ON TABLE push_tokens IS 'Expo/FCM push tokens. Multiple devices per user.';

-- ──────────────────────────────────────────────
-- 16. notifications
-- ──────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        notification_type NOT NULL DEFAULT 'system',
  data        JSONB DEFAULT '{}'::jsonb,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE notifications IS 'Notification history. Push delivery is server-side only.';

-- ──────────────────────────────────────────────
-- 17. bus_proximity_events
-- ──────────────────────────────────────────────
CREATE TABLE bus_proximity_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id      UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  trip_id     UUID REFERENCES trips(id) ON DELETE SET NULL,
  entered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  exited_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bus_id, child_id, trip_id)
);
COMMENT ON TABLE bus_proximity_events IS 'Prevents duplicate 1km notifications per trip approach.';

-- ──────────────────────────────────────────────
-- 18. audit_logs
-- ──────────────────────────────────────────────
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  school_id     UUID REFERENCES schools(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     UUID,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE audit_logs IS 'Audit trail for sensitive operations. No passwords/OTPs stored.';


-- ──────────────────────────────────────────────
-- Auto-compute PostGIS location columns via triggers
-- ──────────────────────────────────────────────

-- Children: auto-set pickup_location from pickup_lat/pickup_lng
CREATE OR REPLACE FUNCTION compute_child_pickup_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
    NEW.pickup_location := extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326)::extensions.geography;
  ELSE
    NEW.pickup_location := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_children_set_location
  BEFORE INSERT OR UPDATE OF pickup_lat, pickup_lng ON children
  FOR EACH ROW EXECUTE FUNCTION compute_child_pickup_location();

-- bus_live_locations: auto-set PostGIS location from lat/lng
CREATE OR REPLACE FUNCTION compute_bus_live_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.location := extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::extensions.geography;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bus_location_set_geo
  BEFORE INSERT OR UPDATE OF latitude, longitude ON bus_live_locations
  FOR EACH ROW EXECUTE FUNCTION compute_bus_live_location();

-- bus_stops: auto-set PostGIS location from lat/lng
CREATE OR REPLACE FUNCTION compute_bus_stop_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.location := extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::extensions.geography;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bus_stop_set_geo
  BEFORE INSERT OR UPDATE OF latitude, longitude ON bus_stops
  FOR EACH ROW EXECUTE FUNCTION compute_bus_stop_location();
-- ============================================================================
-- BusTracker: 004_indexes.sql
-- Performance indexes for frequently queried columns
-- PostGIS spatial indexes for proximity queries
-- ============================================================================

-- ── profiles ──
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- ── schools ──
CREATE INDEX idx_schools_status ON schools(status);
CREATE INDEX idx_schools_admin_user_id ON schools(admin_user_id);

-- ── school_members ──
CREATE INDEX idx_school_members_school_user ON school_members(school_id, user_id);
CREATE INDEX idx_school_members_user_id ON school_members(user_id);

-- ── authorized_contacts ──
CREATE INDEX idx_auth_contacts_school_phone ON authorized_contacts(school_id, phone);
CREATE INDEX idx_auth_contacts_phone ON authorized_contacts(phone);
CREATE INDEX idx_auth_contacts_type ON authorized_contacts(contact_type);

-- ── children ──
CREATE INDEX idx_children_school_id ON children(school_id);
CREATE INDEX idx_children_assigned_bus ON children(assigned_bus_id);
CREATE INDEX idx_children_is_active ON children(school_id, is_active);

-- ── child_parents ──
CREATE INDEX idx_child_parents_parent ON child_parents(parent_user_id);
CREATE INDEX idx_child_parents_child ON child_parents(child_id);

-- ── buses ──
CREATE INDEX idx_buses_school_id ON buses(school_id);

-- ── drivers ──
CREATE INDEX idx_drivers_school_id ON drivers(school_id);
CREATE INDEX idx_drivers_assigned_bus ON drivers(assigned_bus_id);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);

-- ── bus_live_locations ──
CREATE INDEX idx_bus_live_updated ON bus_live_locations(updated_at);
CREATE INDEX idx_bus_live_is_live ON bus_live_locations(is_live);

-- ── trips ──
CREATE INDEX idx_trips_bus_id ON trips(bus_id);
CREATE INDEX idx_trips_driver_status ON trips(driver_id, status);
CREATE INDEX idx_trips_school_id ON trips(school_id);
CREATE INDEX idx_trips_status ON trips(status);

-- ── trip_locations ──
CREATE INDEX idx_trip_locations_trip_time ON trip_locations(trip_id, recorded_at);

-- ── bus_stops ──
CREATE INDEX idx_bus_stops_bus_order ON bus_stops(bus_id, stop_order);

-- ── subscriptions ──
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status_end ON subscriptions(status, paid_end);
CREATE INDEX idx_subscriptions_trial_end ON subscriptions(trial_end);

-- ── push_tokens ──
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(user_id, is_active);

-- ── notifications ──
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(user_id, created_at DESC);

-- ── bus_proximity_events ──
CREATE INDEX idx_proximity_bus_child ON bus_proximity_events(bus_id, child_id);
CREATE INDEX idx_proximity_trip ON bus_proximity_events(trip_id);

-- ── audit_logs ──
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_school ON audit_logs(school_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ════════════════════════════════════════════
-- PostGIS Spatial Indexes (critical for 1km proximity)
-- ════════════════════════════════════════════
CREATE INDEX idx_children_pickup_geo ON children USING GIST(pickup_location);
CREATE INDEX idx_bus_live_location_geo ON bus_live_locations USING GIST(location);
CREATE INDEX idx_bus_stops_location_geo ON bus_stops USING GIST(location);
-- ============================================================================
-- BusTracker: 005_functions.sql
-- Authorization helpers + Business logic functions
-- ALL security-critical logic runs here (server-side), NOT in client
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1: AUTHORIZATION HELPER FUNCTIONS
-- These are used by RLS policies and business functions
-- ════════════════════════════════════════════════════════════════════════════

-- Is current user a super admin?
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
$$;
COMMENT ON FUNCTION is_super_admin IS 'Checks if auth.uid() is an active super_admin.';


-- Is current user an admin/member of a specific school?
CREATE OR REPLACE FUNCTION is_school_member(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM school_members
    WHERE school_id = p_school_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;


-- Is current user the admin of a specific school?
CREATE OR REPLACE FUNCTION is_school_admin(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM school_members
    WHERE school_id = p_school_id
      AND user_id = auth.uid()
      AND role = 'school_admin'
      AND is_active = true
  );
$$;


-- Get school_id(s) the current user belongs to
CREATE OR REPLACE FUNCTION get_user_school_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM school_members
  WHERE user_id = auth.uid() AND is_active = true;
$$;


-- Is current user a parent of a specific child?
CREATE OR REPLACE FUNCTION is_parent_of_child(p_child_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM child_parents
    WHERE child_id = p_child_id
      AND parent_user_id = auth.uid()
  );
$$;


-- Is current user the driver of a specific bus?
CREATE OR REPLACE FUNCTION is_driver_of_bus(p_bus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid()
      AND assigned_bus_id = p_bus_id
      AND is_active = true
  );
$$;


-- Can the current user view a specific bus? (parent / driver / school admin / super admin)
CREATE OR REPLACE FUNCTION can_view_bus(p_bus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    is_super_admin()
    OR is_driver_of_bus(p_bus_id)
    OR EXISTS (
      -- Parent: child is assigned to this bus
      SELECT 1 FROM child_parents cp
      JOIN children c ON c.id = cp.child_id
      WHERE cp.parent_user_id = auth.uid()
        AND c.assigned_bus_id = p_bus_id
        AND c.is_active = true
    )
    OR EXISTS (
      -- School member: bus belongs to their school
      SELECT 1 FROM buses b
      JOIN school_members sm ON sm.school_id = b.school_id
      WHERE b.id = p_bus_id
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
    );
$$;


-- Is subscription currently active for a user? (trial OR paid)
CREATE OR REPLACE FUNCTION is_subscription_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND (
        (status = 'trial'  AND trial_end > NOW())
        OR (status = 'active' AND paid_end  > NOW())
      )
  );
$$;
COMMENT ON FUNCTION is_subscription_active IS 'Server-side check. Never trust client subscription status.';


-- Get subscription status details for a user (safe public info only)
CREATE OR REPLACE FUNCTION get_subscription_status(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_sub RECORD;
BEGIN
  v_uid := COALESCE(p_user_id, auth.uid());

  -- Security: only allow self or super admin
  IF v_uid != auth.uid() AND NOT is_super_admin() THEN
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;

  SELECT * INTO v_sub
  FROM subscriptions
  WHERE user_id = v_uid
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_subscription', false,
      'is_active', false
    );
  END IF;

  RETURN jsonb_build_object(
    'has_subscription', true,
    'is_active', is_subscription_active(v_uid),
    'plan_type', v_sub.plan_type,
    'status', v_sub.status,
    'trial_end', v_sub.trial_end,
    'paid_end', v_sub.paid_end
  );
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2: SCHOOL MANAGEMENT FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Approve school (Super Admin only)
CREATE OR REPLACE FUNCTION approve_school(p_school_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school schools%ROWTYPE;
BEGIN
  -- Only super admin
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'FORBIDDEN',
      'message', 'You are not authorized to perform this action.'
    ));
  END IF;

  -- Fetch school
  SELECT * INTO v_school FROM schools WHERE id = p_school_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NOT_FOUND',
      'message', 'School not found.'
    ));
  END IF;

  IF v_school.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'INVALID_STATUS',
      'message', 'Only pending schools can be approved.'
    ));
  END IF;

  -- Approve
  UPDATE schools
  SET status = 'approved',
      approved_by = auth.uid(),
      approved_at = NOW(),
      updated_at = NOW()
  WHERE id = p_school_id;

  -- Create school_members entry for school admin
  IF v_school.admin_user_id IS NOT NULL THEN
    INSERT INTO school_members(school_id, user_id, role, is_active)
    VALUES (p_school_id, v_school.admin_user_id, 'school_admin', true)
    ON CONFLICT(school_id, user_id) DO UPDATE SET is_active = true, updated_at = NOW();
  END IF;

  -- Audit log
  INSERT INTO audit_logs(actor_user_id, school_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_school_id, 'approve_school', 'school', p_school_id,
    jsonb_build_object('school_name', v_school.name));

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object(
    'school_id', p_school_id,
    'school_name', v_school.name,
    'status', 'approved'
  ));
END;
$$;


-- Reject school (Super Admin only)
CREATE OR REPLACE FUNCTION reject_school(p_school_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'FORBIDDEN',
      'message', 'You are not authorized to perform this action.'
    ));
  END IF;

  UPDATE schools SET status = 'rejected', updated_at = NOW()
  WHERE id = p_school_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NOT_FOUND',
      'message', 'Pending school not found.'
    ));
  END IF;

  INSERT INTO audit_logs(actor_user_id, school_id, action, entity_type, entity_id)
  VALUES (auth.uid(), p_school_id, 'reject_school', 'school', p_school_id);

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Block school (Super Admin only)
CREATE OR REPLACE FUNCTION block_school(p_school_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'FORBIDDEN',
      'message', 'You are not authorized to perform this action.'
    ));
  END IF;

  UPDATE schools SET status = 'blocked', updated_at = NOW()
  WHERE id = p_school_id AND status IN ('approved', 'pending');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NOT_FOUND',
      'message', 'School not found or already blocked.'
    ));
  END IF;

  INSERT INTO audit_logs(actor_user_id, school_id, action, entity_type, entity_id)
  VALUES (auth.uid(), p_school_id, 'block_school', 'school', p_school_id);

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3: REGISTRATION FUNCTIONS (server-side authorization checks)
-- ════════════════════════════════════════════════════════════════════════════

-- Register parent (checks authorized_contacts server-side)
CREATE OR REPLACE FUNCTION register_parent(
  p_phone TEXT,
  p_full_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact authorized_contacts%ROWTYPE;
  v_school  schools%ROWTYPE;
  v_child   children%ROWTYPE;
BEGIN
  -- Server-side check: is this phone authorized by any school?
  SELECT * INTO v_contact
  FROM authorized_contacts
  WHERE phone = p_phone
    AND contact_type = 'parent'
    AND is_registered = false
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NOT_AUTHORIZED',
      'message', 'Your phone number is not authorized by the school. Please contact your school.'
    ));
  END IF;

  -- Check school is approved
  SELECT * INTO v_school
  FROM schools
  WHERE id = v_contact.school_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'SCHOOL_NOT_APPROVED',
      'message', 'Your school is not yet approved on the platform.'
    ));
  END IF;

  -- Upsert profile (server determines role, NOT client)
  INSERT INTO profiles(id, phone, full_name, role, is_active)
  VALUES (auth.uid(), p_phone, p_full_name, 'parent', true)
  ON CONFLICT(id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'parent',
    updated_at = NOW();

  -- Link parent to child (if child_id is set in authorized_contacts)
  IF v_contact.child_id IS NOT NULL THEN
    INSERT INTO child_parents(child_id, parent_user_id, relationship, is_primary)
    VALUES (v_contact.child_id, auth.uid(), 'guardian', true)
    ON CONFLICT(child_id, parent_user_id) DO NOTHING;
  END IF;

  -- Mark contact as registered
  UPDATE authorized_contacts
  SET is_registered = true, updated_at = NOW()
  WHERE id = v_contact.id;

  -- Create 7-day free trial (server sets dates, NOT client)
  INSERT INTO subscriptions(user_id, school_id, plan_type, status, trial_start, trial_end)
  VALUES (auth.uid(), v_contact.school_id, 'free_trial', 'trial', NOW(), NOW() + INTERVAL '7 days')
  ON CONFLICT DO NOTHING;

  -- Audit
  INSERT INTO audit_logs(actor_user_id, school_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), v_contact.school_id, 'register_parent', 'profile', auth.uid(),
    jsonb_build_object('phone', p_phone, 'child_id', v_contact.child_id));

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object(
    'school_id', v_school.id,
    'school_name', v_school.name,
    'child_id', v_contact.child_id,
    'trial_end', (NOW() + INTERVAL '7 days')::text
  ));
END;
$$;


-- Register driver (checks authorized_contacts server-side)
CREATE OR REPLACE FUNCTION register_driver(
  p_phone TEXT,
  p_full_name TEXT,
  p_license_number TEXT DEFAULT NULL,
  p_license_expiry DATE DEFAULT NULL,
  p_experience_years INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact authorized_contacts%ROWTYPE;
  v_school  schools%ROWTYPE;
BEGIN
  -- Server-side check: is this phone authorized as driver?
  SELECT * INTO v_contact
  FROM authorized_contacts
  WHERE phone = p_phone
    AND contact_type = 'driver'
    AND is_registered = false
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NOT_AUTHORIZED',
      'message', 'Your phone number is not authorized by the school. Please contact your school.'
    ));
  END IF;

  -- Check school is approved
  SELECT * INTO v_school
  FROM schools
  WHERE id = v_contact.school_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'SCHOOL_NOT_APPROVED',
      'message', 'Your school is not yet approved on the platform.'
    ));
  END IF;

  -- Upsert profile (server determines role)
  INSERT INTO profiles(id, phone, full_name, role, is_active)
  VALUES (auth.uid(), p_phone, p_full_name, 'driver', true)
  ON CONFLICT(id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'driver',
    updated_at = NOW();

  -- Create driver record
  INSERT INTO drivers(user_id, school_id, license_number, license_expiry, experience_years)
  VALUES (auth.uid(), v_contact.school_id, p_license_number, p_license_expiry, p_experience_years)
  ON CONFLICT(user_id) DO UPDATE SET
    school_id = v_contact.school_id,
    license_number = COALESCE(p_license_number, drivers.license_number),
    license_expiry = COALESCE(p_license_expiry, drivers.license_expiry),
    experience_years = COALESCE(p_experience_years, drivers.experience_years),
    updated_at = NOW();

  -- Add to school_members
  INSERT INTO school_members(school_id, user_id, role, is_active)
  VALUES (v_contact.school_id, auth.uid(), 'driver', true)
  ON CONFLICT(school_id, user_id) DO UPDATE SET is_active = true, updated_at = NOW();

  -- Mark contact as registered
  UPDATE authorized_contacts
  SET is_registered = true, updated_at = NOW()
  WHERE id = v_contact.id;

  -- Audit
  INSERT INTO audit_logs(actor_user_id, school_id, action, entity_type, entity_id)
  VALUES (auth.uid(), v_contact.school_id, 'register_driver', 'driver', auth.uid());

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object(
    'school_id', v_school.id,
    'school_name', v_school.name
  ));
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 4: LIVE TRACKING FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Update bus live location (validates driver owns bus + active trip exists)
CREATE OR REPLACE FUNCTION update_bus_location(
  p_bus_id    UUID,
  p_lat       DOUBLE PRECISION,
  p_lng       DOUBLE PRECISION,
  p_speed     NUMERIC DEFAULT 0,
  p_heading   NUMERIC DEFAULT 0,
  p_accuracy  NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver drivers%ROWTYPE;
  v_school schools%ROWTYPE;
BEGIN
  -- Server validates: driver is authenticated AND owns this bus
  SELECT * INTO v_driver
  FROM drivers
  WHERE user_id = auth.uid()
    AND assigned_bus_id = p_bus_id
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NOT_AUTHORIZED',
      'message', 'You are not authorized to update this bus location.'
    ));
  END IF;

  -- Validate school is approved
  SELECT * INTO v_school
  FROM schools
  WHERE id = v_driver.school_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'SCHOOL_NOT_APPROVED',
      'message', 'School is not approved.'
    ));
  END IF;

  -- UPSERT live location (one row per bus, never creates new rows)
  INSERT INTO bus_live_locations(bus_id, driver_id, latitude, longitude, speed, heading, accuracy, is_live, updated_at)
  VALUES (p_bus_id, v_driver.id, p_lat, p_lng, p_speed, p_heading, p_accuracy, true, NOW())
  ON CONFLICT(bus_id) DO UPDATE SET
    driver_id  = v_driver.id,
    latitude   = p_lat,
    longitude  = p_lng,
    speed      = p_speed,
    heading    = p_heading,
    accuracy   = p_accuracy,
    is_live    = true,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Stop broadcasting location
CREATE OR REPLACE FUNCTION stop_bus_location(p_bus_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_driver_of_bus(p_bus_id) THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NOT_AUTHORIZED'));
  END IF;

  UPDATE bus_live_locations
  SET is_live = false, updated_at = NOW()
  WHERE bus_id = p_bus_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 5: TRIP MANAGEMENT FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Start trip (server validates everything: auth, driver, bus, school)
CREATE OR REPLACE FUNCTION start_trip(p_trip_type trip_type)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver  drivers%ROWTYPE;
  v_school  schools%ROWTYPE;
  v_bus     buses%ROWTYPE;
  v_trip_id UUID;
  v_existing_trip UUID;
BEGIN
  -- Get driver record for current user
  SELECT * INTO v_driver
  FROM drivers
  WHERE user_id = auth.uid() AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NOT_DRIVER',
      'message', 'You are not registered as an active driver.'
    ));
  END IF;

  -- Must have assigned bus
  IF v_driver.assigned_bus_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'NO_BUS_ASSIGNED',
      'message', 'No bus is assigned to you.'
    ));
  END IF;

  -- Validate bus is active
  SELECT * INTO v_bus
  FROM buses
  WHERE id = v_driver.assigned_bus_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'BUS_INACTIVE',
      'message', 'Your assigned bus is not active.'
    ));
  END IF;

  -- Validate school is approved
  SELECT * INTO v_school
  FROM schools
  WHERE id = v_driver.school_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'SCHOOL_NOT_APPROVED',
      'message', 'Your school is not approved.'
    ));
  END IF;

  -- Check no existing in-progress trip for this driver
  SELECT id INTO v_existing_trip
  FROM trips
  WHERE driver_id = v_driver.id AND status = 'in_progress'
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'TRIP_ALREADY_ACTIVE',
      'message', 'You already have an active trip. Please end it first.'
    ));
  END IF;

  -- Create trip
  INSERT INTO trips(bus_id, driver_id, school_id, trip_type, started_at, status)
  VALUES (v_driver.assigned_bus_id, v_driver.id, v_driver.school_id, p_trip_type, NOW(), 'in_progress')
  RETURNING id INTO v_trip_id;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object(
    'trip_id', v_trip_id,
    'bus_id', v_driver.assigned_bus_id,
    'trip_type', p_trip_type
  ));
END;
$$;


-- Stop trip (validates driver owns this trip)
CREATE OR REPLACE FUNCTION stop_trip(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip trips%ROWTYPE;
  v_driver drivers%ROWTYPE;
BEGIN
  -- Get driver
  SELECT * INTO v_driver
  FROM drivers WHERE user_id = auth.uid() AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_DRIVER'));
  END IF;

  -- Get and validate trip
  SELECT * INTO v_trip
  FROM trips
  WHERE id = p_trip_id
    AND driver_id = v_driver.id
    AND status = 'in_progress';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'TRIP_NOT_FOUND',
      'message', 'Active trip not found or you are not the driver.'
    ));
  END IF;

  -- End trip (trigger will mark bus as not live)
  UPDATE trips
  SET status = 'completed', ended_at = NOW()
  WHERE id = p_trip_id;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object(
    'trip_id', p_trip_id,
    'ended_at', NOW()::text
  ));
END;
$$;


-- Save trip location point (for history replay)
CREATE OR REPLACE FUNCTION save_trip_location(
  p_trip_id   UUID,
  p_lat       DOUBLE PRECISION,
  p_lng       DOUBLE PRECISION,
  p_speed     NUMERIC DEFAULT NULL,
  p_heading   NUMERIC DEFAULT NULL,
  p_accuracy  NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip trips%ROWTYPE;
  v_driver drivers%ROWTYPE;
BEGIN
  -- Validate driver owns this trip
  SELECT * INTO v_driver FROM drivers WHERE user_id = auth.uid() AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_DRIVER'));
  END IF;

  SELECT * INTO v_trip FROM trips
  WHERE id = p_trip_id AND driver_id = v_driver.id AND status = 'in_progress';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'INVALID_TRIP'));
  END IF;

  INSERT INTO trip_locations(trip_id, latitude, longitude, speed, heading, accuracy, recorded_at)
  VALUES (p_trip_id, p_lat, p_lng, p_speed, p_heading, p_accuracy, NOW());

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 6: DRIVER/BUS ASSIGNMENT (School Admin only)
-- ════════════════════════════════════════════════════════════════════════════

-- Assign driver to bus (school admin validates ownership)
CREATE OR REPLACE FUNCTION assign_driver_to_bus(
  p_driver_id UUID,
  p_bus_id    UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver drivers%ROWTYPE;
  v_bus    buses%ROWTYPE;
BEGIN
  -- Get driver and validate
  SELECT * INTO v_driver FROM drivers WHERE id = p_driver_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'DRIVER_NOT_FOUND'));
  END IF;

  -- Caller must be school admin of this driver's school (or super admin)
  IF NOT is_school_admin(v_driver.school_id) AND NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN'));
  END IF;

  -- Validate bus belongs to same school
  SELECT * INTO v_bus FROM buses WHERE id = p_bus_id AND school_id = v_driver.school_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'BUS_NOT_FOUND',
      'message', 'Bus not found in this school.'
    ));
  END IF;

  UPDATE drivers SET assigned_bus_id = p_bus_id, updated_at = NOW() WHERE id = p_driver_id;

  INSERT INTO audit_logs(actor_user_id, school_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), v_driver.school_id, 'assign_driver_to_bus', 'driver', p_driver_id,
    jsonb_build_object('bus_id', p_bus_id));

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Assign child to bus (school admin validates ownership)
CREATE OR REPLACE FUNCTION assign_child_to_bus(
  p_child_id UUID,
  p_bus_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child children%ROWTYPE;
  v_bus   buses%ROWTYPE;
BEGIN
  SELECT * INTO v_child FROM children WHERE id = p_child_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'CHILD_NOT_FOUND'));
  END IF;

  IF NOT is_school_admin(v_child.school_id) AND NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN'));
  END IF;

  SELECT * INTO v_bus FROM buses WHERE id = p_bus_id AND school_id = v_child.school_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'BUS_NOT_FOUND'));
  END IF;

  UPDATE children SET assigned_bus_id = p_bus_id, updated_at = NOW() WHERE id = p_child_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 7: PROXIMITY DETECTION (PostGIS server-side)
-- ════════════════════════════════════════════════════════════════════════════

-- Find all children whose pickup is within N meters of a bus
CREATE OR REPLACE FUNCTION find_children_near_bus(
  p_bus_id        UUID,
  p_radius_meters INTEGER DEFAULT 1000
)
RETURNS TABLE(
  child_id        UUID,
  child_name      TEXT,
  parent_user_id  UUID,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    c.id        AS child_id,
    c.full_name AS child_name,
    cp.parent_user_id,
    extensions.ST_Distance(bll.location, c.pickup_location) AS distance_meters
  FROM bus_live_locations bll
  JOIN children c ON c.assigned_bus_id = bll.bus_id AND c.is_active = true
  JOIN child_parents cp ON cp.child_id = c.id
  WHERE bll.bus_id = p_bus_id
    AND bll.is_live = true
    AND c.pickup_location IS NOT NULL
    AND extensions.ST_DWithin(bll.location, c.pickup_location, p_radius_meters);
$$;
COMMENT ON FUNCTION find_children_near_bus IS 'PostGIS 1km proximity. Called by Edge Function, not by client.';


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 8: DASHBOARD AGGREGATE FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Parent dashboard (one secure call = all needed data)
CREATE OR REPLACE FUNCTION get_parent_dashboard()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (
      SELECT jsonb_build_object(
        'id', p.id, 'phone', p.phone, 'full_name', p.full_name,
        'avatar_url', p.avatar_url, 'role', p.role
      ) FROM profiles p WHERE p.id = auth.uid()
    ),
    'subscription', get_subscription_status(),
    'children', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'full_name', c.full_name,
        'class', c.class,
        'section', c.section,
        'assigned_bus_id', c.assigned_bus_id,
        'bus_number', b.bus_number,
        'route_name', b.route_name,
        'photo_url', c.photo_url
      ))
      FROM children c
      JOIN child_parents cp ON cp.child_id = c.id
      LEFT JOIN buses b ON b.id = c.assigned_bus_id
      WHERE cp.parent_user_id = auth.uid() AND c.is_active = true
    ), '[]'::jsonb),
    'unread_notifications', (
      SELECT COUNT(*) FROM notifications
      WHERE user_id = auth.uid() AND is_read = false
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- School dashboard (school admin sees their school data)
CREATE OR REPLACE FUNCTION get_school_dashboard(p_school_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validate access
  IF NOT is_school_admin(p_school_id) AND NOT is_super_admin() THEN
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;

  SELECT jsonb_build_object(
    'school', (SELECT row_to_json(s) FROM schools s WHERE s.id = p_school_id),
    'stats', jsonb_build_object(
      'student_count', (SELECT COUNT(*) FROM children WHERE school_id = p_school_id AND is_active = true),
      'bus_count', (SELECT COUNT(*) FROM buses WHERE school_id = p_school_id AND is_active = true),
      'driver_count', (SELECT COUNT(*) FROM drivers WHERE school_id = p_school_id AND is_active = true),
      'active_trips', (SELECT COUNT(*) FROM trips WHERE school_id = p_school_id AND status = 'in_progress')
    ),
    'active_buses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'bus_id', bll.bus_id,
        'bus_number', b.bus_number,
        'latitude', bll.latitude,
        'longitude', bll.longitude,
        'speed', bll.speed,
        'is_live', bll.is_live,
        'updated_at', bll.updated_at
      ))
      FROM bus_live_locations bll
      JOIN buses b ON b.id = bll.bus_id
      WHERE b.school_id = p_school_id AND bll.is_live = true
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- Driver dashboard
CREATE OR REPLACE FUNCTION get_driver_dashboard()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver  drivers%ROWTYPE;
  v_result  JSONB;
BEGIN
  SELECT * INTO v_driver FROM drivers WHERE user_id = auth.uid() AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'NOT_DRIVER');
  END IF;

  SELECT jsonb_build_object(
    'profile', (SELECT jsonb_build_object(
      'id', p.id, 'full_name', p.full_name, 'phone', p.phone, 'avatar_url', p.avatar_url
    ) FROM profiles p WHERE p.id = auth.uid()),
    'driver', jsonb_build_object(
      'id', v_driver.id,
      'assigned_bus_id', v_driver.assigned_bus_id,
      'license_number', v_driver.license_number,
      'rating', v_driver.rating
    ),
    'bus', (
      SELECT jsonb_build_object(
        'id', b.id, 'bus_number', b.bus_number, 'route_name', b.route_name, 'capacity', b.capacity
      ) FROM buses b WHERE b.id = v_driver.assigned_bus_id
    ),
    'school', (
      SELECT jsonb_build_object(
        'id', s.id, 'name', s.name, 'phone', s.phone
      ) FROM schools s WHERE s.id = v_driver.school_id
    ),
    'active_trip', (
      SELECT jsonb_build_object('id', t.id, 'trip_type', t.trip_type, 'started_at', t.started_at)
      FROM trips t WHERE t.driver_id = v_driver.id AND t.status = 'in_progress' LIMIT 1
    ),
    'students_on_bus', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'full_name', c.full_name, 'class', c.class, 'section', c.section,
        'pickup_address', c.pickup_address
      ))
      FROM children c
      WHERE c.assigned_bus_id = v_driver.assigned_bus_id AND c.is_active = true
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
-- ============================================================================
-- BusTracker: 006_triggers.sql
-- Database triggers for automated server-side logic
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. Auto-create profile when auth user is created
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles(id, phone, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'parent'
    )
  )
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ────────────────────────────────────────────
-- 2. Auto-update updated_at timestamps
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_school_members_updated_at
  BEFORE UPDATE ON school_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_buses_updated_at
  BEFORE UPDATE ON buses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_authorized_contacts_updated_at
  BEFORE UPDATE ON authorized_contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bus_stops_updated_at
  BEFORE UPDATE ON bus_stops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ────────────────────────────────────────────
-- 3. When trip ends → mark bus as not live
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_trip_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When trip goes from in_progress → completed/cancelled
  IF OLD.status = 'in_progress'
     AND NEW.status IN ('completed', 'cancelled') THEN

    -- Set ended_at if not already set
    IF NEW.ended_at IS NULL THEN
      NEW.ended_at := NOW();
    END IF;

    -- Mark bus location as not live
    UPDATE bus_live_locations
    SET is_live = false, updated_at = NOW()
    WHERE bus_id = NEW.bus_id;

    -- Clear any active proximity events for this trip
    UPDATE bus_proximity_events
    SET exited_at = NOW()
    WHERE trip_id = NEW.id AND exited_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trip_status_change
  BEFORE UPDATE OF status ON trips
  FOR EACH ROW
  EXECUTE FUNCTION handle_trip_status_change();

COMMENT ON TRIGGER trg_trip_status_change ON trips IS
  'When trip completes/cancels: mark bus not live + close proximity events.';


-- ────────────────────────────────────────────
-- 4. When school is approved → set approval timestamp
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_school_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When school transitions to approved
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    NEW.approved_at := COALESCE(NEW.approved_at, NOW());
  END IF;

  -- When school is blocked, deactivate its members
  IF NEW.status = 'blocked' AND OLD.status != 'blocked' THEN
    UPDATE school_members
    SET is_active = false, updated_at = NOW()
    WHERE school_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_school_status_change
  BEFORE UPDATE OF status ON schools
  FOR EACH ROW
  EXECUTE FUNCTION handle_school_status_change();


-- ────────────────────────────────────────────
-- 5. When subscription status changes → audit log
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (
      COALESCE(auth.uid(), NEW.user_id),
      'subscription_status_change',
      'subscription',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'plan_type', NEW.plan_type,
        'user_id', NEW.user_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscription_status_change
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_change();


-- ────────────────────────────────────────────
-- 6. Notify on bus location update (for proximity Edge Function)
-- This uses pg_notify to trigger external processing
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_bus_location_update()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify when bus is actively live
  IF NEW.is_live = true THEN
    PERFORM pg_notify(
      'bus_location_updated',
      json_build_object(
        'bus_id', NEW.bus_id,
        'latitude', NEW.latitude,
        'longitude', NEW.longitude,
        'driver_id', NEW.driver_id
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bus_location_notify
  AFTER INSERT OR UPDATE ON bus_live_locations
  FOR EACH ROW
  EXECUTE FUNCTION notify_bus_location_update();

COMMENT ON TRIGGER trg_bus_location_notify ON bus_live_locations IS
  'Sends pg_notify when bus location updates. Edge Function listens for proximity checks.';
-- ============================================================================
-- BusTracker: 007_rls.sql
-- Row Level Security policies for ALL tables
-- SECURITY CRITICAL: Every table has RLS enabled. No table is publicly open.
-- ============================================================================


-- ════════════════════════════════════════════
-- ENABLE RLS ON EVERY TABLE
-- ════════════════════════════════════════════
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools               ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_contacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE children              ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_parents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_live_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_stops             ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_proximity_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════
-- 1. PROFILES
-- ════════════════════════════════════════════

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Super Admin can read all profiles
CREATE POLICY "profiles_select_super_admin" ON profiles
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- School admin can read profiles of their school members
CREATE POLICY "profiles_select_school_member" ON profiles
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT user_id FROM school_members WHERE school_id IN (SELECT get_user_school_ids()))
  );

-- Users can update their own profile (but NOT role or is_active)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ════════════════════════════════════════════
-- 2. SCHOOLS
-- ════════════════════════════════════════════

-- Super Admin can do everything
CREATE POLICY "schools_super_admin_all" ON schools
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can read their own school
CREATE POLICY "schools_select_own" ON schools
  FOR SELECT TO authenticated
  USING (is_school_member(id));

-- Any authenticated user can insert (registration request)
CREATE POLICY "schools_insert_registration" ON schools
  FOR INSERT TO authenticated
  WITH CHECK (status = 'pending');

-- Authenticated users can see approved schools (for listing)
CREATE POLICY "schools_select_approved" ON schools
  FOR SELECT TO authenticated
  USING (status = 'approved');


-- ════════════════════════════════════════════
-- 3. SCHOOL_MEMBERS
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "school_members_super_admin" ON school_members
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can manage their school's members
CREATE POLICY "school_members_school_admin" ON school_members
  FOR ALL TO authenticated
  USING (is_school_admin(school_id))
  WITH CHECK (is_school_admin(school_id));

-- Users can read their own membership
CREATE POLICY "school_members_select_own" ON school_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- ════════════════════════════════════════════
-- 4. AUTHORIZED_CONTACTS
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "auth_contacts_super_admin" ON authorized_contacts
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can manage their school's authorized contacts
CREATE POLICY "auth_contacts_school_admin" ON authorized_contacts
  FOR ALL TO authenticated
  USING (is_school_admin(school_id))
  WITH CHECK (is_school_admin(school_id));


-- ════════════════════════════════════════════
-- 5. CHILDREN
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "children_super_admin" ON children
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can manage their school's children
CREATE POLICY "children_school_admin" ON children
  FOR ALL TO authenticated
  USING (is_school_admin(school_id))
  WITH CHECK (is_school_admin(school_id));

-- Parent can read their own children (via child_parents)
CREATE POLICY "children_parent_read" ON children
  FOR SELECT TO authenticated
  USING (is_parent_of_child(id));

-- Driver can read children assigned to their bus
CREATE POLICY "children_driver_read" ON children
  FOR SELECT TO authenticated
  USING (
    assigned_bus_id IN (
      SELECT assigned_bus_id FROM drivers
      WHERE user_id = auth.uid() AND is_active = true AND assigned_bus_id IS NOT NULL
    )
  );


-- ════════════════════════════════════════════
-- 6. CHILD_PARENTS
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "child_parents_super_admin" ON child_parents
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can manage child-parent links for their school
CREATE POLICY "child_parents_school_admin" ON child_parents
  FOR ALL TO authenticated
  USING (
    child_id IN (SELECT id FROM children WHERE school_id IN (SELECT get_user_school_ids()))
  )
  WITH CHECK (
    child_id IN (SELECT id FROM children WHERE school_id IN (SELECT get_user_school_ids()))
  );

-- Parent can read their own child-parent links
CREATE POLICY "child_parents_parent_read" ON child_parents
  FOR SELECT TO authenticated
  USING (parent_user_id = auth.uid());


-- ════════════════════════════════════════════
-- 7. BUSES
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "buses_super_admin" ON buses
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can manage their school's buses
CREATE POLICY "buses_school_admin" ON buses
  FOR ALL TO authenticated
  USING (is_school_admin(school_id))
  WITH CHECK (is_school_admin(school_id));

-- Parents can read buses assigned to their children
CREATE POLICY "buses_parent_read" ON buses
  FOR SELECT TO authenticated
  USING (can_view_bus(id));

-- Driver can read their assigned bus
CREATE POLICY "buses_driver_read" ON buses
  FOR SELECT TO authenticated
  USING (is_driver_of_bus(id));


-- ════════════════════════════════════════════
-- 8. DRIVERS
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "drivers_super_admin" ON drivers
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can manage their school's drivers
CREATE POLICY "drivers_school_admin" ON drivers
  FOR ALL TO authenticated
  USING (is_school_admin(school_id))
  WITH CHECK (is_school_admin(school_id));

-- Driver can read their own record
CREATE POLICY "drivers_self_read" ON drivers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Driver can update their own non-sensitive fields
CREATE POLICY "drivers_self_update" ON drivers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ════════════════════════════════════════════
-- 9. BUS_LIVE_LOCATIONS (SECURITY CRITICAL)
-- ════════════════════════════════════════════

-- Read: only if user can view this bus
CREATE POLICY "bus_live_locations_select" ON bus_live_locations
  FOR SELECT TO authenticated
  USING (can_view_bus(bus_id));

-- Insert/Update: only the driver of this bus (via update_bus_location() function)
CREATE POLICY "bus_live_locations_insert" ON bus_live_locations
  FOR INSERT TO authenticated
  WITH CHECK (is_driver_of_bus(bus_id));

CREATE POLICY "bus_live_locations_update" ON bus_live_locations
  FOR UPDATE TO authenticated
  USING (is_driver_of_bus(bus_id))
  WITH CHECK (is_driver_of_bus(bus_id));

-- Super Admin can read all
CREATE POLICY "bus_live_locations_super_admin" ON bus_live_locations
  FOR SELECT TO authenticated
  USING (is_super_admin());


-- ════════════════════════════════════════════
-- 10. TRIPS
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "trips_super_admin" ON trips
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can read their school's trips
CREATE POLICY "trips_school_read" ON trips
  FOR SELECT TO authenticated
  USING (is_school_member(school_id));

-- Driver can read/create their own trips (via start_trip/stop_trip functions)
CREATE POLICY "trips_driver_read" ON trips
  FOR SELECT TO authenticated
  USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- Parent can read trips of their child's bus
CREATE POLICY "trips_parent_read" ON trips
  FOR SELECT TO authenticated
  USING (can_view_bus(bus_id));


-- ════════════════════════════════════════════
-- 11. TRIP_LOCATIONS
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "trip_locations_super_admin" ON trip_locations
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can read their school's trip history
CREATE POLICY "trip_locations_school_read" ON trip_locations
  FOR SELECT TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE school_id IN (SELECT get_user_school_ids()))
  );

-- Driver can read/write their own trip locations
CREATE POLICY "trip_locations_driver" ON trip_locations
  FOR ALL TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  )
  WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  );

-- Parent can read trip history for their child's bus
CREATE POLICY "trip_locations_parent_read" ON trip_locations
  FOR SELECT TO authenticated
  USING (
    trip_id IN (
      SELECT t.id FROM trips t
      JOIN children c ON c.assigned_bus_id = t.bus_id
      JOIN child_parents cp ON cp.child_id = c.id
      WHERE cp.parent_user_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════
-- 12. BUS_STOPS
-- ════════════════════════════════════════════

-- Super Admin full access
CREATE POLICY "bus_stops_super_admin" ON bus_stops
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can manage their school's bus stops
CREATE POLICY "bus_stops_school_admin" ON bus_stops
  FOR ALL TO authenticated
  USING (
    bus_id IN (SELECT id FROM buses WHERE school_id IN (SELECT get_user_school_ids()))
  )
  WITH CHECK (
    bus_id IN (SELECT id FROM buses WHERE school_id IN (SELECT get_user_school_ids()))
  );

-- Anyone who can view the bus can read its stops
CREATE POLICY "bus_stops_read" ON bus_stops
  FOR SELECT TO authenticated
  USING (can_view_bus(bus_id));


-- ════════════════════════════════════════════
-- 13. SUBSCRIPTION_PLANS
-- ════════════════════════════════════════════

-- Everyone can read active plans (including anon during signup)
CREATE POLICY "sub_plans_read_active" ON subscription_plans
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Super Admin can manage plans
CREATE POLICY "sub_plans_super_admin" ON subscription_plans
  FOR ALL TO authenticated
  USING (is_super_admin());


-- ════════════════════════════════════════════
-- 14. SUBSCRIPTIONS
-- ════════════════════════════════════════════

-- User can read their own subscription
CREATE POLICY "subscriptions_read_own" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Super Admin can read all
CREATE POLICY "subscriptions_super_admin" ON subscriptions
  FOR ALL TO authenticated
  USING (is_super_admin());

-- School admin can read subscriptions of their school's parents
CREATE POLICY "subscriptions_school_read" ON subscriptions
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));

-- NO direct insert/update from client — managed by server functions only


-- ════════════════════════════════════════════
-- 15. PUSH_TOKENS
-- ════════════════════════════════════════════

-- Users manage their own push tokens
CREATE POLICY "push_tokens_own" ON push_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ════════════════════════════════════════════
-- 16. NOTIFICATIONS
-- ════════════════════════════════════════════

-- Users can read their own notifications
CREATE POLICY "notifications_read_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update is_read on their own notifications
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super Admin can read all
CREATE POLICY "notifications_super_admin" ON notifications
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- NO direct insert from client — notifications created by server only


-- ════════════════════════════════════════════
-- 17. BUS_PROXIMITY_EVENTS
-- ════════════════════════════════════════════

-- Super Admin can read
CREATE POLICY "proximity_super_admin" ON bus_proximity_events
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- School admin can read their school's events
CREATE POLICY "proximity_school_read" ON bus_proximity_events
  FOR SELECT TO authenticated
  USING (
    bus_id IN (SELECT id FROM buses WHERE school_id IN (SELECT get_user_school_ids()))
  );

-- Parent can read proximity events for their child
CREATE POLICY "proximity_parent_read" ON bus_proximity_events
  FOR SELECT TO authenticated
  USING (
    child_id IN (SELECT child_id FROM child_parents WHERE parent_user_id = auth.uid())
  );

-- NO direct insert from client — managed by Edge Function only


-- ════════════════════════════════════════════
-- 18. AUDIT_LOGS
-- ════════════════════════════════════════════

-- Only Super Admin can read audit logs
CREATE POLICY "audit_logs_super_admin" ON audit_logs
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- NO direct insert from client — audit logs created by server functions only
-- ============================================================================
-- BusTracker: 008_storage.sql
-- Supabase Storage buckets and access policies
-- ============================================================================

-- ────────────────────────────────────────────
-- Create storage buckets
-- ────────────────────────────────────────────

-- User profile avatars (private — only owner can access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', false,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- School logos (public — displayed in listings)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-logos', 'school-logos', true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Child photos (private — only parent, school admin, driver)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'child-photos', 'child-photos', false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Driver documents (private — only driver, school admin, super admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents', 'driver-documents', false,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────
-- Storage RLS Policies
-- ────────────────────────────────────────────

-- ── Avatars: user can only access their own folder ──
-- Path format: avatars/{user_id}/filename.jpg
CREATE POLICY "avatars_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ── School Logos: school admin can upload, public can read ──
-- Path format: school-logos/{school_id}/logo.png
CREATE POLICY "school_logos_select_public" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'school-logos');

CREATE POLICY "school_logos_insert_school_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'school-logos'
    AND is_school_admin((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "school_logos_update_school_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'school-logos'
    AND is_school_admin((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "school_logos_delete_school_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'school-logos'
    AND is_school_admin((storage.foldername(name))[1]::uuid)
  );

-- Super Admin can manage all school logos
CREATE POLICY "school_logos_super_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'school-logos' AND is_super_admin());


-- ── Child Photos: parent/school admin/driver with access ──
-- Path format: child-photos/{school_id}/{child_id}/photo.jpg
CREATE POLICY "child_photos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND (
      is_super_admin()
      OR is_school_admin((storage.foldername(name))[1]::uuid)
      OR is_parent_of_child((storage.foldername(name))[2]::uuid)
    )
  );

CREATE POLICY "child_photos_insert_school" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'child-photos'
    AND (
      is_school_admin((storage.foldername(name))[1]::uuid)
      OR is_super_admin()
    )
  );

CREATE POLICY "child_photos_insert_parent" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'child-photos'
    AND is_parent_of_child((storage.foldername(name))[2]::uuid)
  );


-- ── Driver Documents: driver can upload, school admin + super admin can view ──
-- Path format: driver-documents/{user_id}/filename.pdf
CREATE POLICY "driver_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_super_admin()
      -- School admin can view their school's driver documents
      OR EXISTS (
        SELECT 1 FROM drivers d
        JOIN school_members sm ON sm.school_id = d.school_id
        WHERE d.user_id = (storage.foldername(name))[1]::uuid
          AND sm.user_id = auth.uid()
          AND sm.is_active = true
      )
    )
  );

CREATE POLICY "driver_docs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "driver_docs_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
-- ============================================================================
-- BusTracker: 009_realtime.sql
-- Supabase Realtime publication configuration
-- Only tables that need real-time updates are published
-- RLS filters what each user can see in Realtime
-- ============================================================================

-- ────────────────────────────────────────────
-- Enable Realtime on specific tables
-- ────────────────────────────────────────────

-- Bus live locations: parents see their child's bus in real time
-- RLS ensures parent only receives their authorized bus data
ALTER PUBLICATION supabase_realtime ADD TABLE bus_live_locations;

-- Notifications: users get instant notification updates
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Trips: parents/school admins see trip start/stop in real time
ALTER PUBLICATION supabase_realtime ADD TABLE trips;

-- ────────────────────────────────────────────
-- Tables NOT published to Realtime (by design):
-- ────────────────────────────────────────────
-- profiles           → rarely changes, fetch on demand
-- schools            → rarely changes
-- school_members     → admin-only
-- authorized_contacts → admin-only
-- children           → changes infrequently
-- child_parents      → changes infrequently
-- buses              → changes infrequently
-- drivers            → changes infrequently
-- trip_locations     → historical data, too high volume
-- bus_stops          → changes infrequently
-- subscription_plans → admin-only
-- subscriptions      → fetch on demand
-- push_tokens        → internal
-- bus_proximity_events → internal
-- audit_logs         → admin-only
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
