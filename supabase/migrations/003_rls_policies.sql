-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Optimized: Single policy per action, subquery wrappers for performance
-- ============================================

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.get_my_role()) = 'admin'
  );

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING ((SELECT public.get_my_role()) = 'admin');

-- ============================================
-- COMPANIES POLICIES
-- ============================================
CREATE POLICY "companies_select"
  ON companies FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "companies_insert"
  ON companies FOR INSERT
  WITH CHECK ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "companies_update"
  ON companies FOR UPDATE
  USING ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "companies_delete"
  ON companies FOR DELETE
  USING ((SELECT public.get_my_role()) = 'admin');

-- ============================================
-- COMPANY LOCATIONS POLICIES
-- ============================================
CREATE POLICY "company_locations_select"
  ON company_locations FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "company_locations_insert"
  ON company_locations FOR INSERT
  WITH CHECK (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "company_locations_update"
  ON company_locations FOR UPDATE
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "company_locations_delete"
  ON company_locations FOR DELETE
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

-- ============================================
-- REQUESTS POLICIES
-- ============================================
CREATE POLICY "requests_select"
  ON requests FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "requests_insert"
  ON requests FOR INSERT
  WITH CHECK (
    (SELECT public.get_my_role()) = 'admin'
    OR (
      company_id = (SELECT public.get_my_company_id())
      AND submitted_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "requests_update"
  ON requests FOR UPDATE
  USING ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "requests_delete"
  ON requests FOR DELETE
  USING ((SELECT public.get_my_role()) = 'admin');

-- ============================================
-- QUOTES POLICIES
-- ============================================
CREATE POLICY "quotes_select"
  ON quotes FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "quotes_insert"
  ON quotes FOR INSERT
  WITH CHECK ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "quotes_update"
  ON quotes FOR UPDATE
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR (
      company_id = (SELECT public.get_my_company_id())
      AND status = 'sent'
    )
  )
  WITH CHECK (
    (SELECT public.get_my_role()) = 'admin'
    OR status IN ('accepted', 'declined', 'revision_requested')
  );

CREATE POLICY "quotes_delete"
  ON quotes FOR DELETE
  USING ((SELECT public.get_my_role()) = 'admin');

-- ============================================
-- QUOTE_LINE_ITEMS POLICIES
-- ============================================
CREATE POLICY "quote_line_items_select"
  ON quote_line_items FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_line_items.quote_id
      AND quotes.company_id = (SELECT public.get_my_company_id())
    )
  );

CREATE POLICY "quote_line_items_insert"
  ON quote_line_items FOR INSERT
  WITH CHECK ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "quote_line_items_update"
  ON quote_line_items FOR UPDATE
  USING ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "quote_line_items_delete"
  ON quote_line_items FOR DELETE
  USING ((SELECT public.get_my_role()) = 'admin');

-- ============================================
-- JOBS POLICIES
-- ============================================
CREATE POLICY "jobs_select"
  ON jobs FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "jobs_insert"
  ON jobs FOR INSERT
  WITH CHECK ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "jobs_update"
  ON jobs FOR UPDATE
  USING ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "jobs_delete"
  ON jobs FOR DELETE
  USING ((SELECT public.get_my_role()) = 'admin');

-- ============================================
-- DOCUMENTS POLICIES
-- ============================================
CREATE POLICY "documents_select"
  ON documents FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "documents_insert"
  ON documents FOR INSERT
  WITH CHECK ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "documents_update"
  ON documents FOR UPDATE
  USING ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "documents_delete"
  ON documents FOR DELETE
  USING ((SELECT public.get_my_role()) = 'admin');

-- ============================================
-- INVOICES POLICIES
-- ============================================
CREATE POLICY "invoices_select"
  ON invoices FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR company_id = (SELECT public.get_my_company_id())
  );

CREATE POLICY "invoices_insert"
  ON invoices FOR INSERT
  WITH CHECK ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "invoices_update"
  ON invoices FOR UPDATE
  USING ((SELECT public.get_my_role()) = 'admin');

CREATE POLICY "invoices_delete"
  ON invoices FOR DELETE
  USING ((SELECT public.get_my_role()) = 'admin');

-- ============================================
-- TIMELINE_EVENTS POLICIES
-- Write access is admin-only. Client actions trigger events via DB triggers.
-- ============================================
CREATE POLICY "Admins can manage all timeline events"
  ON timeline_events
  TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Clients can view their company timeline events"
  ON timeline_events
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'client'
    AND (
      (entity_type = 'request' AND entity_id IN (
        SELECT id FROM requests WHERE company_id = public.get_my_company_id()
      ))
      OR
      (entity_type = 'quote' AND entity_id IN (
        SELECT id FROM quotes WHERE company_id = public.get_my_company_id()
      ))
      OR
      (entity_type = 'job' AND entity_id IN (
        SELECT id FROM jobs WHERE company_id = public.get_my_company_id()
      ))
    )
  );
