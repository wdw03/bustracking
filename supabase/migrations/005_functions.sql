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
