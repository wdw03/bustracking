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
