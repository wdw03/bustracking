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
