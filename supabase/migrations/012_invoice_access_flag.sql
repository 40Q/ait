-- ============================================
-- INVOICE ACCESS FLAG
-- Allows managers to grant invoice access to specific sub-company users.
-- ============================================

-- Add invoice_access flag to profiles (default false for all users)
ALTER TABLE profiles ADD COLUMN invoice_access BOOLEAN NOT NULL DEFAULT FALSE;

-- Update invoices_select to also allow sub-company clients who have been
-- explicitly granted access by their manager
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

    -- Sub-company clients who have been explicitly granted invoice access
    OR (
      (SELECT public.get_my_role()) = 'client'
      AND company_id = (SELECT public.get_my_company_id())
      AND (
        SELECT invoice_access FROM public.profiles WHERE id = (SELECT auth.uid())
      ) = TRUE
    )
  );
