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
