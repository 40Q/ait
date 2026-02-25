-- ============================================
-- FIX: Company name unique constraint
-- Previously: absolute UNIQUE on name (blocked re-adding deleted company names)
-- Now: no uniqueness constraint — admins can reuse names freely
-- ============================================

ALTER TABLE companies DROP CONSTRAINT companies_name_key;

-- ============================================
-- FIX: Allow user deletion when company is deleted
-- timeline_events.actor_id is the only FK to profiles(id) that isn't
-- already cascade-deleted through the company. Change it to SET NULL
-- so that deleting a user just clears the actor reference on historical events.
-- ============================================

ALTER TABLE timeline_events DROP CONSTRAINT timeline_events_actor_id_fkey;
ALTER TABLE timeline_events ADD CONSTRAINT timeline_events_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
