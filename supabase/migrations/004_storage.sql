-- ============================================
-- STORAGE BUCKETS AND POLICIES
-- ============================================

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Create request-files bucket (for equipment photos, COI samples)
-- Private bucket - requires signed URLs to access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-files',
  'request-files',
  false,  -- private bucket - access controlled via RLS and signed URLs
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create documents bucket (for job certificates and reports)
-- Private bucket - requires signed URLs to access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,  -- private bucket - access controlled via RLS and signed URLs
  52428800,  -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- REQUEST-FILES BUCKET POLICIES
-- Equipment photos, COI samples uploaded by clients
-- ============================================

-- Admins: full access
CREATE POLICY "request_files_admin_all"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'request-files'
    AND (SELECT public.get_my_role()) = 'admin'
  )
  WITH CHECK (
    bucket_id = 'request-files'
    AND (SELECT public.get_my_role()) = 'admin'
  );

-- Clients: can upload to their company folder
CREATE POLICY "request_files_client_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'request-files'
    AND (SELECT public.get_my_role()) = 'client'
    AND (storage.foldername(name))[1] = (SELECT public.get_my_company_id())::text
  );

-- Clients: can view their company's files
CREATE POLICY "request_files_client_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'request-files'
    AND (storage.foldername(name))[1] = (SELECT public.get_my_company_id())::text
  );

-- Clients: can delete their company's files
CREATE POLICY "request_files_client_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'request-files'
    AND (SELECT public.get_my_role()) = 'client'
    AND (storage.foldername(name))[1] = (SELECT public.get_my_company_id())::text
  );

-- ============================================
-- DOCUMENTS BUCKET POLICIES
-- Job certificates and reports (admin uploads)
-- ============================================

-- Admins: full access
CREATE POLICY "documents_admin_all"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'documents'
    AND (SELECT public.get_my_role()) = 'admin'
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (SELECT public.get_my_role()) = 'admin'
  );

-- Clients: can view their company's documents
CREATE POLICY "documents_client_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT public.get_my_company_id())::text
  );
