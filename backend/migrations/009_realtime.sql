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
