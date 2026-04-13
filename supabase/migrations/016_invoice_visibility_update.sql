-- ============================================
-- INVOICE VISIBILITY UPDATE
-- 1. Sub-company clients can always see their own company's invoices (no access flag required)
-- 2. invoice_access flag now grants access to PARENT company invoices (not own company)
-- 3. Managers retain full visibility over their company + all sub-companies
-- 4. Sub-company clients can read their parent company row (needed to show parent company name)
-- ============================================

-- Helper function to get the current user's parent company ID without triggering RLS
-- (same SECURITY DEFINER pattern as get_my_company_id)
CREATE OR REPLACE FUNCTION public.get_my_parent_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT parent_company_id FROM public.companies WHERE id = (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  );
$$;

-- Allow sub-company clients to read their parent company record
DROP POLICY "companies_select" ON companies;

CREATE POLICY "companies_select"
  ON companies FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'

    -- Any user can see their own company
    OR id = (SELECT public.get_my_company_id())

    -- Managers can see all their sub-companies
    OR (
      (SELECT public.get_my_role()) = 'manager'
      AND parent_company_id = (SELECT public.get_my_company_id())
    )

    -- Sub-company clients can see their parent company
    OR (
      (SELECT public.get_my_role()) = 'client'
      AND id = (SELECT public.get_my_parent_company_id())
    )
  );

DROP POLICY "invoices_select" ON invoices;

CREATE POLICY "invoices_select"
  ON invoices FOR SELECT
  USING (
    -- AIT admins see everything
    (SELECT public.get_my_role()) = 'admin'

    -- Managers see invoices for their own company and all sub-companies
    OR (
      (SELECT public.get_my_role()) = 'manager'
      AND company_id IN (
        SELECT id FROM public.companies
        WHERE id = (SELECT public.get_my_company_id())
           OR parent_company_id = (SELECT public.get_my_company_id())
      )
    )

    -- Regular clients (not in a sub-company) always see their own invoices
    OR (
      (SELECT public.get_my_role()) = 'client'
      AND company_id = (SELECT public.get_my_company_id())
      AND NOT EXISTS (
        SELECT 1 FROM public.companies
        WHERE id = (SELECT public.get_my_company_id())
          AND parent_company_id IS NOT NULL
      )
    )

    -- Sub-company clients always see their own company's invoices
    OR (
      (SELECT public.get_my_role()) = 'client'
      AND company_id = (SELECT public.get_my_company_id())
      AND EXISTS (
        SELECT 1 FROM public.companies
        WHERE id = (SELECT public.get_my_company_id())
          AND parent_company_id IS NOT NULL
      )
    )

    -- Sub-company clients with granted access also see their parent company's invoices
    OR (
      (SELECT public.get_my_role()) = 'client'
      AND (
        SELECT invoice_access FROM public.profiles WHERE id = (SELECT auth.uid())
      ) = TRUE
      AND company_id = (
        SELECT parent_company_id FROM public.companies
        WHERE id = (SELECT public.get_my_company_id())
      )
    )
  );

-- ============================================
-- UPDATE STORAGE POLICY FOR INVOICE FILES
-- Sub-company clients can always read their own company's invoice files.
-- With invoice_access they can also read parent company invoice files.
-- ============================================

DROP POLICY IF EXISTS "Clients with access can read invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Clients can read invoice files" ON storage.objects;

CREATE POLICY "Clients can read invoice files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1
    FROM profiles client_profile
    JOIN companies client_company ON client_company.id = client_profile.company_id
    JOIN invoices ON (
      -- Sub-company clients always see their own company's invoice files
      invoices.company_id = client_profile.company_id
      -- Sub-company clients with granted access also see parent company's invoice files
      OR (
        client_profile.invoice_access = TRUE
        AND invoices.company_id = client_company.parent_company_id
      )
    )
    WHERE client_profile.id = auth.uid()
    AND client_profile.role = 'client'
    AND client_company.parent_company_id IS NOT NULL
    AND storage.objects.name LIKE invoices.id || '/%'
  )
);
