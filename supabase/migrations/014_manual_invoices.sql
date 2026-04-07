-- Add pdf_path to invoices for manually uploaded invoices (non-QuickBooks)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Sequence for auto-generating manual invoice numbers (M-0001, M-0002, ...)
CREATE SEQUENCE IF NOT EXISTS manual_invoice_seq START 1;

-- Function to generate the next manual invoice number
CREATE OR REPLACE FUNCTION next_manual_invoice_number()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 'M-' || LPAD(nextval('manual_invoice_seq')::TEXT, 4, '0');
$$;

-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Admins can do everything
CREATE POLICY "Admins can manage invoice files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Storage RLS: Managers can read invoice files for their company + sub-companies
CREATE POLICY "Managers can read invoice files for their companies"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles manager_profile
    JOIN companies ON (
      companies.id = manager_profile.company_id
      OR companies.parent_company_id = manager_profile.company_id
    )
    JOIN invoices ON invoices.company_id = companies.id
    WHERE manager_profile.id = auth.uid()
    AND manager_profile.role = 'manager'
    AND storage.objects.name LIKE invoices.id || '/%'
  )
);

-- Storage RLS: Clients with invoice_access can read their company's invoice files
CREATE POLICY "Clients with access can read invoice files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles client_profile
    JOIN invoices ON invoices.company_id = client_profile.company_id
    WHERE client_profile.id = auth.uid()
    AND client_profile.role = 'client'
    AND client_profile.invoice_access = TRUE
    AND storage.objects.name LIKE invoices.id || '/%'
  )
);
