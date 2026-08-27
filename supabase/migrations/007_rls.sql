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
