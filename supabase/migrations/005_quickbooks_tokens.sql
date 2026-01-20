-- ============================================
-- QUICKBOOKS TOKENS TABLE
-- Stores OAuth tokens for QuickBooks integration
-- ============================================

CREATE TABLE quickbooks_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  realm_id TEXT NOT NULL UNIQUE,  -- QuickBooks company ID
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by realm_id
CREATE INDEX idx_quickbooks_tokens_realm_id ON quickbooks_tokens(realm_id);

-- Enable RLS
ALTER TABLE quickbooks_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can access tokens (very sensitive data)
CREATE POLICY "quickbooks_tokens_admin_only"
  ON quickbooks_tokens
  FOR ALL
  USING ((SELECT public.get_my_role()) = 'admin');

-- Updated_at trigger
CREATE TRIGGER update_quickbooks_tokens_updated_at
  BEFORE UPDATE ON quickbooks_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
