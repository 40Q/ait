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
      console.warn("[OneSignal] Push skipped — not configured (missing appId or restApiKey)");
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
        console.error("[OneSignal] Push failed:", response.status, responseText);
        return null;
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error("[OneSignal] Push request error:", error);
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
      console.warn("[OneSignal] Email skipped — not configured (missing appId or restApiKey)");
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
        console.error("[OneSignal] Email failed:", response.status, responseText);
        return null;
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error("[OneSignal] Email request error:", error);
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
      console.warn("[OneSignal] Push (filter) skipped — not configured");
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
        console.error("[OneSignal] Push (filter) failed:", response.status, responseText);
        return null;
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error("[OneSignal] Push (filter) request error:", error);
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
      console.warn("[OneSignal] Email (filter) skipped — not configured");
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
        console.error("[OneSignal] Email (filter) failed:", response.status, responseText);
        return null;
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error("[OneSignal] Email (filter) request error:", error);
      return null;
    }
  }
  /**
   * Register a user with OneSignal server-side.
   * Creates the user with an email subscription and tags so they can
   * receive email notifications before ever visiting the app.
   * Uses the OneSignal User Model API (REST API v2).
   */
  async registerUserEmail(params: {
    externalId: string;
    email: string;
    role: string;
    companyId?: string;
  }): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("[OneSignal] registerUserEmail skipped — not configured");
      return false;
    }

    const tags: Record<string, string> = {
      user_role: params.role,
    };
    if (params.companyId) {
      tags.company_id = params.companyId;
    }

    const payload = {
      identity: { external_id: params.externalId },
      subscriptions: [
        {
          type: "Email",
          token: params.email,
          enabled: true,
        },
      ],
      tags,
    };

    try {
      const response = await fetch(
        `https://api.onesignal.com/apps/${this.appId}/users`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        // 409 means user already exists — that's fine
        if (response.status === 409) {
          console.log(
            `[OneSignal] User ${params.externalId} already registered, updating tags`
          );
          await this.updateUserTags(params.externalId, tags);
          return true;
        }
        console.error(
          "[OneSignal] registerUserEmail failed:",
          response.status,
          responseText
        );
        return false;
      }

      console.log(
        `[OneSignal] Registered user ${params.externalId} with email ${params.email}`
      );
      return true;
    } catch (error) {
      console.error("[OneSignal] registerUserEmail error:", error);
      return false;
    }
  }

  /**
   * Update tags on an existing OneSignal user.
   */
  private async updateUserTags(
    externalId: string,
    tags: Record<string, string>
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://api.onesignal.com/apps/${this.appId}/users/by/external_id/${externalId}`,
        {
          method: "PATCH",
          headers: this.headers,
          body: JSON.stringify({ tags }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("[OneSignal] updateUserTags failed:", response.status, text);
      }
    } catch (error) {
      console.error("[OneSignal] updateUserTags error:", error);
    }
  }
}

export const onesignalClient = new OneSignalClient();
