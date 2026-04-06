-- ============================================
-- MANAGER ROLE
-- Adds a "manager" role that can create sub-companies and invite users.
-- Sub-companies are regular companies with a parent_company_id pointing
-- to the manager's company. Managers cannot see request/quote/job data.
-- ============================================

-- ============================================
-- 1. Add parent_company_id to companies (self-referential FK)
-- ============================================
ALTER TABLE companies ADD COLUMN parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX idx_companies_parent_id ON companies(parent_company_id);

-- ============================================
-- 2. Allow 'manager' in profiles.role
-- ============================================
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'client', 'manager'));

-- ============================================
-- 3. Update RLS policies to support manager access
-- ============================================

-- COMPANIES: managers can SELECT their own company + all sub-companies
DROP POLICY "companies_select" ON companies;
CREATE POLICY "companies_select"
  ON companies FOR SELECT
  USING (
    (SELECT public.get_my_role()) = 'admin'
    OR id = (SELECT public.get_my_company_id())
    OR (
      (SELECT public.get_my_role()) = 'manager'
      AND parent_company_id = (SELECT public.get_my_company_id())
    )
  );

-- COMPANIES: managers can INSERT sub-companies (must set parent_company_id = their company)
DROP POLICY "companies_insert" ON companies;
CREATE POLICY "companies_insert"
  ON companies FOR INSERT
  WITH CHECK (
    (SELECT public.get_my_role()) = 'admin'
    OR (
      (SELECT public.get_my_role()) = 'manager'
      AND parent_company_id = (SELECT public.get_my_company_id())
    )
  );

-- PROFILES: managers can SELECT users belonging to their sub-companies
DROP POLICY "profiles_select" ON profiles;
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.get_my_role()) = 'admin'
    OR (
      (SELECT public.get_my_role()) = 'manager'
      AND company_id IN (
        SELECT id FROM public.companies
        WHERE parent_company_id = (SELECT public.get_my_company_id())
      )
    )
  );
