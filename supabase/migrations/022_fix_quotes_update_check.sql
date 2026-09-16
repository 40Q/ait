-- ============================================
-- FIX: quotes_update allowed clients to rewrite any column
--
-- The app ships a browser Supabase client with the publishable key, so a
-- client user can call PostgREST directly with their own session. The old
-- "quotes_update" policy only constrained the resulting `status` in its
-- WITH CHECK:
--
--   WITH CHECK (get_my_role() = 'admin'
--               OR status IN ('accepted','declined','revision_requested'))
--
-- Every other column was freely writable. A client could UPDATE their own
-- sent quote with `total = 0, subtotal = 0, status = 'accepted'` and skip
-- /api/workflow/respond-to-quote entirely, or move the quote to a different
-- company_id, or repoint request_id at a request belonging to another company.
--
-- Three changes:
--
-- 1. The non-admin WITH CHECK branch now also requires
--    company_id = get_my_company_id(), so a client cannot hand their quote
--    to another company on the way out.
--
-- 2. A WITH CHECK cannot see the OLD row, so it cannot express "this column
--    did not change". A BEFORE UPDATE trigger does that instead: for any
--    non-admin caller, the pricing and linkage columns must be byte-identical
--    between OLD and NEW.
--
-- 3. A non-admin may only attribute an acceptance to themselves. Without this
--    a client could accept their own quote under a colleague's name, forging
--    the signatory on what is effectively a signed contract. NULL stays legal:
--    the decline and revision_requested branches never set accepted_by, so
--    requiring equality outright would break them.
--
-- Columns a non-admin may still write (the legitimate respondToQuote flow in
-- lib/database/services/workflow.service.ts writes exactly these):
--   status, revision_message, decline_reason, accepted_at, accepted_by,
--   signature_name  -- plus updated_at, set by the update_updated_at trigger.
-- Everything else on the row is frozen for non-admins.
-- ============================================

DROP POLICY IF EXISTS "quotes_update" ON quotes;

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
    OR (
      company_id = (SELECT public.get_my_company_id())
      AND status IN ('accepted', 'declined', 'revision_requested')
      AND (
        accepted_by IS NULL
        OR accepted_by = (SELECT auth.uid())
      )
    )
  );

-- ============================================
-- Freeze pricing / linkage columns for non-admins
-- ============================================
CREATE OR REPLACE FUNCTION public.enforce_quote_client_update_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT public.get_my_role()) = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.id            IS DISTINCT FROM OLD.id
     OR NEW.quote_number  IS DISTINCT FROM OLD.quote_number
     OR NEW.request_id    IS DISTINCT FROM OLD.request_id
     OR NEW.company_id    IS DISTINCT FROM OLD.company_id
     OR NEW.created_by    IS DISTINCT FROM OLD.created_by
     OR NEW.valid_until   IS DISTINCT FROM OLD.valid_until
     OR NEW.subtotal      IS DISTINCT FROM OLD.subtotal
     OR NEW.discount      IS DISTINCT FROM OLD.discount
     OR NEW.discount_type IS DISTINCT FROM OLD.discount_type
     OR NEW.total         IS DISTINCT FROM OLD.total
     OR NEW.terms         IS DISTINCT FROM OLD.terms
     OR NEW.sent_at       IS DISTINCT FROM OLD.sent_at
     OR NEW.created_at    IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION
      'Only admins may change quote pricing, terms or linkage columns'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_quote_client_update_columns() IS
  'Blocks non-admin UPDATEs that alter any quote column outside the client '
  'response set (status, revision_message, decline_reason, accepted_at, '
  'accepted_by, signature_name, updated_at). RLS WITH CHECK cannot compare '
  'against the OLD row, so this runs as a BEFORE UPDATE trigger.';

DROP TRIGGER IF EXISTS enforce_quote_client_update_columns_trigger ON quotes;

CREATE TRIGGER enforce_quote_client_update_columns_trigger
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_quote_client_update_columns();
