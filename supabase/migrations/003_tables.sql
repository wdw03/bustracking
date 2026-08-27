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
