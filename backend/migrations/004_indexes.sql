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
