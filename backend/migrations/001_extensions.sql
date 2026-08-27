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
