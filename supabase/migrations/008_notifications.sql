-- ============================================
-- NOTIFICATION SYSTEM
-- Stores notifications and user preferences
-- ============================================

-- ============================================
-- NOTIFICATION TYPE ENUM
-- ============================================
CREATE TYPE notification_type AS ENUM (
  'request_submitted',
  'quote_sent',
  'quote_accepted',
  'quote_declined',
  'quote_revision_requested',
  'pickup_scheduled',
  'pickup_complete',
  'job_complete',
  'invoice_overdue',
  'document_uploaded'
);

-- ============================================
-- NOTIFICATION PRIORITY ENUM
-- ============================================
CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high'
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Recipient
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'normal',
  action_url TEXT,

  -- Entity references (for linking to related records)
  entity_type TEXT,
  entity_id UUID,

  -- Status tracking
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,

  -- Delivery tracking
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  push_sent BOOLEAN NOT NULL DEFAULT FALSE,
  push_sent_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE AND is_dismissed = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Users can update their own notifications (mark as read/dismissed)
CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- Allow all inserts (security enforced at application level via SECURITY DEFINER function)
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete"
  ON notifications FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User reference
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Channel preferences
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- OneSignal player ID for push notifications
  onesignal_player_id TEXT,
  onesignal_email_id TEXT,

  -- Per-type preferences (JSON object with type -> boolean)
  -- If a type is not present, defaults to enabled
  type_preferences JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Index for preferences
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY "notification_preferences_select"
  ON notification_preferences FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Allow all inserts (for server-side creation)
CREATE POLICY "notification_preferences_insert"
  ON notification_preferences FOR INSERT
  WITH CHECK (true);

-- Users can update their own preferences
CREATE POLICY "notification_preferences_update"
  ON notification_preferences FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- Users can delete their own preferences
CREATE POLICY "notification_preferences_delete"
  ON notification_preferences FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTION: Create default preferences on user creation
-- ============================================
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when a new profile is created
CREATE TRIGGER create_notification_preferences_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- These bypass RLS for notification system operations
-- ============================================

-- Function to insert notifications (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_priority notification_priority DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    priority,
    action_url,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_action_url,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(UUID, notification_type, TEXT, TEXT, notification_priority, TEXT, TEXT, UUID, JSONB) TO authenticated;

-- Function to get all admin users for broadcasting notifications
CREATE OR REPLACE FUNCTION public.get_admin_users_for_notification()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name
  FROM profiles p
  WHERE p.role = 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_for_notification() TO authenticated;

-- Function to get all users for a specific company
CREATE OR REPLACE FUNCTION public.get_company_users_for_notification(p_company_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name
  FROM profiles p
  WHERE p.company_id = p_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_users_for_notification(UUID) TO authenticated;

-- Function to get notification preferences for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email_enabled BOOLEAN,
  push_enabled BOOLEAN,
  onesignal_player_id TEXT,
  onesignal_email_id TEXT,
  type_preferences JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT np.id, np.user_id, np.email_enabled, np.push_enabled,
         np.onesignal_player_id, np.onesignal_email_id, np.type_preferences,
         np.created_at, np.updated_at
  FROM notification_preferences np
  WHERE np.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_notification_preferences(UUID) TO authenticated;
