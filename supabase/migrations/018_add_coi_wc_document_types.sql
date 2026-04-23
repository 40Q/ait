-- Add certificate_of_insurance and workers_compensation to document_type CHECK constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
  CHECK (document_type IN (
    'certificate_of_destruction',
    'certificate_of_recycling',
    'hd_serialization',
    'asset_serialization',
    'warehouse_report',
    'pickup_document',
    'miscellaneous',
    'certificate_of_insurance',
    'workers_compensation'
  ));
