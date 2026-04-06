-- ============================================
-- ADD invoice_access_requested notification type
-- ============================================
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invoice_access_requested';

-- ============================================
-- INVOICE ACCESS RESTRICTIONS
-- Managers can view invoices for their company and all sub-companies.
-- Clients in sub-companies (parent_company_id IS NOT NULL) cannot view
-- invoices directly — they must request access from the manager.
-- Regular clients (no parent company) retain current access.
-- ============================================

DROP POLICY "invoices_select" ON invoices;

CREATE POLICY "invoices_select"
  ON invoices FOR SELECT
  USING (
    -- AIT admins see everything
    (SELECT public.get_my_role()) = 'admin'

    -- Managers see invoices for their own company and all their sub-companies
    OR (
      (SELECT public.get_my_role()) = 'manager'
      AND company_id IN (
        SELECT id FROM public.companies
        WHERE id = (SELECT public.get_my_company_id())
           OR parent_company_id = (SELECT public.get_my_company_id())
      )
    )

    -- Regular clients (not in a sub-company) see their own company's invoices
    OR (
      (SELECT public.get_my_role()) = 'client'
      AND company_id = (SELECT public.get_my_company_id())
      AND NOT EXISTS (
        SELECT 1 FROM public.companies
        WHERE id = (SELECT public.get_my_company_id())
          AND parent_company_id IS NOT NULL
      )
    )
  );
