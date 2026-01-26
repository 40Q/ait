// Notification types - single source of truth
// These arrays are used to derive both TypeScript types and Zod schemas

export const NOTIFICATION_TYPES = [
  'request_submitted',
  'quote_sent',
  'quote_accepted',
  'quote_declined',
  'quote_revision_requested',
  'pickup_scheduled',
  'pickup_complete',
  'job_complete',
  'invoice_overdue',
  'document_uploaded',
] as const;

export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high'] as const;

export const NOTIFICATION_ENTITY_TYPES = ['request', 'quote', 'job', 'invoice', 'document'] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];
export type NotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

// Notification row
export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  action_url: string | null;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  is_dismissed: boolean;
  dismissed_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  push_sent: boolean;
  push_sent_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type NotificationInsert = Omit<
  NotificationRow,
  | 'id'
  | 'is_read'
  | 'read_at'
  | 'is_dismissed'
  | 'dismissed_at'
  | 'email_sent'
  | 'email_sent_at'
  | 'push_sent'
  | 'push_sent_at'
  | 'created_at'
  | 'updated_at'
> & {
  id?: string;
  is_read?: boolean;
  is_dismissed?: boolean;
  email_sent?: boolean;
  push_sent?: boolean;
  metadata?: Record<string, unknown>;
};

export type NotificationUpdate = Partial<
  Pick<NotificationRow, 'is_read' | 'read_at' | 'is_dismissed' | 'dismissed_at' | 'email_sent' | 'email_sent_at' | 'push_sent' | 'push_sent_at'>
>;

// Notification with relations
export interface NotificationWithRelations extends NotificationRow {
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

// List item for UI
export interface NotificationListItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  action_url: string | null;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

// Filters for querying
export interface NotificationFilters {
  user_id?: string;
  type?: NotificationType | NotificationType[];
  is_read?: boolean;
  is_dismissed?: boolean;
  entity_type?: NotificationEntityType;
  entity_id?: string;
}

// Notification preferences row
export interface NotificationPreferencesRow {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  onesignal_player_id: string | null;
  onesignal_email_id: string | null;
  type_preferences: Record<NotificationType, boolean>;
  created_at: string;
  updated_at: string;
}

export type NotificationPreferencesInsert = Omit<
  NotificationPreferencesRow,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  type_preferences?: Record<NotificationType, boolean>;
};

export type NotificationPreferencesUpdate = Partial<
  Omit<NotificationPreferencesRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

// Type labels for display
export const notificationTypeLabels: Record<NotificationType, string> = {
  request_submitted: 'New Request',
  quote_sent: 'Quote Ready',
  quote_accepted: 'Quote Accepted',
  quote_declined: 'Quote Declined',
  quote_revision_requested: 'Revision Requested',
  pickup_scheduled: 'Pickup Scheduled',
  pickup_complete: 'Pickup Complete',
  job_complete: 'Job Complete',
  invoice_overdue: 'Invoice Overdue',
  document_uploaded: 'Document Uploaded',
};

// Priority labels for display
export const notificationPriorityLabels: Record<NotificationPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

// Dashboard card colors by notification type
export const notificationCardColors: Partial<Record<NotificationType, 'orange' | 'blue' | 'green' | 'red'>> = {
  request_submitted: 'orange',
  quote_sent: 'green',
  quote_accepted: 'green',
  quote_declined: 'red',
  quote_revision_requested: 'orange',
  pickup_scheduled: 'blue',
  job_complete: 'green',
  invoice_overdue: 'red',
};
