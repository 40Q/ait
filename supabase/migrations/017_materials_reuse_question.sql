-- Add materials_available_for_reuse field to requests table (standard form only)
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS materials_available_for_reuse BOOLEAN DEFAULT NULL;
