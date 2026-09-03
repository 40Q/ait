-- Delivery tracking for broadcast/company notifications.
--
-- push_sent/email_sent were only ever set for single-user sends: a broadcast
-- writes rows owned by other users (admins), and RLS silently updates 0 rows
-- when the sender is a client. Without this, a dropped OneSignal send leaves no
-- trace anywhere. SECURITY DEFINER lets the sender record delivery for every
-- row the send covered.

CREATE OR REPLACE FUNCTION public.mark_notifications_delivered(
  p_ids UUID[],
  p_push BOOLEAN DEFAULT FALSE,
  p_email BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET
    push_sent     = push_sent OR p_push,
    push_sent_at  = CASE
                      WHEN p_push AND push_sent_at IS NULL THEN NOW()
                      ELSE push_sent_at
                    END,
    email_sent    = email_sent OR p_email,
    email_sent_at = CASE
                      WHEN p_email AND email_sent_at IS NULL THEN NOW()
                      ELSE email_sent_at
                    END
  WHERE id = ANY(p_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notifications_delivered(UUID[], BOOLEAN, BOOLEAN) TO authenticated;
