export type OneSignalFilter =
  | { field: 'tag'; key: string; relation: '=' | '!=' | '>' | '<' | 'exists' | 'not_exists'; value?: string }
  | { operator: 'OR' | 'AND' };

export interface OneSignalPushPayload {
  app_id: string;
  target_channel: 'push';
  include_aliases?: {
    external_id: string[];
  };
  include_subscription_ids?: string[];
  filters?: OneSignalFilter[];
  contents: {
    en: string;
  };
  headings: {
    en: string;
  };
  url?: string;
  web_url?: string;
  data?: Record<string, unknown>;
  priority?: number;
  ttl?: number;
}

export interface OneSignalEmailPayload {
  app_id: string;
  target_channel: 'email';
  include_aliases?: {
    external_id: string[];
  };
  include_email_tokens?: string[];
  filters?: OneSignalFilter[];
  email_subject: string;
  email_body: string;
  email_from_name?: string;
  email_from_address?: string;
}

export interface OneSignalResponse {
  id: string;
  recipients: number;
  external_id?: string;
  errors?: string[];
}

export interface NotificationContent {
  title: string;
  message: string;
  actionUrl?: string;
}
