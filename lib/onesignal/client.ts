import { onesignalConfig } from "./config";
import type {
  OneSignalPushPayload,
  OneSignalEmailPayload,
  OneSignalResponse,
  OneSignalFilter,
} from "./types";

const isServer = typeof window === "undefined";

class OneSignalClient {
  private readonly appId: string;
  private readonly restApiKey: string;
  private readonly apiUrl: string;

  constructor() {
    this.appId = onesignalConfig.appId;
    this.restApiKey = onesignalConfig.restApiKey;
    this.apiUrl = onesignalConfig.apiUrl;
  }

  private get headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Basic ${this.restApiKey}`,
    };
  }

  private isConfigured(): boolean {
    if (!isServer) {
      return false;
    }
    return Boolean(this.appId && this.restApiKey);
  }

  async sendPushNotification(params: {
    subscriptionIds?: string[];
    externalUserIds?: string[];
    title: string;
    message: string;
    url?: string;
    data?: Record<string, unknown>;
    priority?: "low" | "normal" | "high";
  }): Promise<OneSignalResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const priorityMap = { low: 1, normal: 5, high: 10 };

    const payload: OneSignalPushPayload = {
      app_id: this.appId,
      target_channel: "push",
      headings: { en: params.title },
      contents: { en: params.message },
      web_url: params.url,
      data: params.data,
      priority: priorityMap[params.priority || "normal"],
    };

    if (params.subscriptionIds?.length) {
      payload.include_subscription_ids = params.subscriptionIds;
    } else if (params.externalUserIds?.length) {
      payload.include_aliases = { external_id: params.externalUserIds };
    } else {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return null;
      }

      return JSON.parse(responseText);
    } catch {
      return null;
    }
  }

  async sendEmailNotification(params: {
    emailTokens?: string[];
    externalUserIds?: string[];
    subject: string;
    body: string;
    fromName?: string;
    fromAddress?: string;
  }): Promise<OneSignalResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const payload: OneSignalEmailPayload = {
      app_id: this.appId,
      target_channel: "email",
      email_subject: params.subject,
      email_body: params.body,
      email_from_name: params.fromName || "AIT Electronics Recycling",
      email_from_address: params.fromAddress,
    };

    if (params.emailTokens?.length) {
      payload.include_email_tokens = params.emailTokens;
    } else if (params.externalUserIds?.length) {
      payload.include_aliases = { external_id: params.externalUserIds };
    } else {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return null;
      }

      return JSON.parse(responseText);
    } catch {
      return null;
    }
  }

  async sendPushByFilter(params: {
    filters: OneSignalFilter[];
    title: string;
    message: string;
    url?: string;
    data?: Record<string, unknown>;
    priority?: "low" | "normal" | "high";
  }): Promise<OneSignalResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const priorityMap = { low: 1, normal: 5, high: 10 };

    const payload: OneSignalPushPayload = {
      app_id: this.appId,
      target_channel: "push",
      filters: params.filters,
      headings: { en: params.title },
      contents: { en: params.message },
      web_url: params.url,
      data: params.data,
      priority: priorityMap[params.priority || "normal"],
    };

    try {
      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return null;
      }

      return JSON.parse(responseText);
    } catch {
      return null;
    }
  }

  async sendEmailByFilter(params: {
    filters: OneSignalFilter[];
    subject: string;
    body: string;
    fromName?: string;
    fromAddress?: string;
  }): Promise<OneSignalResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const payload: OneSignalEmailPayload = {
      app_id: this.appId,
      target_channel: "email",
      filters: params.filters,
      email_subject: params.subject,
      email_body: params.body,
      email_from_name: params.fromName || "AIT Electronics Recycling",
      email_from_address: params.fromAddress,
    };

    try {
      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return null;
      }

      return JSON.parse(responseText);
    } catch {
      return null;
    }
  }
}

export const onesignalClient = new OneSignalClient();
