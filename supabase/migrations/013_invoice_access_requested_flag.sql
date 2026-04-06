-- Tracks whether a user has explicitly requested invoice access from their manager.
-- Cleared automatically when the manager grants or revokes access.
ALTER TABLE profiles ADD COLUMN invoice_access_requested BOOLEAN NOT NULL DEFAULT FALSE;
