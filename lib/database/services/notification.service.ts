import { SupabaseClient } from "@supabase/supabase-js";
import { NotificationRepository } from "../repositories/notifications";
import {
  getNotificationContent,
  getEmailHtmlContent,
  onesignalClient,
} from "../../onesignal";
import type { OneSignalFilter } from "../../onesignal";
import type {
  NotificationType,
  NotificationPriority,
  NotificationEntityType,
  NotificationRow,
} from "../types";

interface TemplateContext {
  requestNumber?: string;
  quoteNumber?: string;
  jobNumber?: string;
  invoiceNumber?: string;
  companyName?: string;
  scheduledDate?: string;
  documentType?: string;
  entityId?: string;
}

interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
}

/**
 * NotificationService handles creating and sending notifications.
 * SERVER-SIDE ONLY — this service calls OneSignal directly and requires
 * server environment variables. Use only in API routes, never in client components.
 *
 * - Creates notifications in the database
 * - Sends push notifications via OneSignal
 * - Sends email notifications via OneSignal
 */
export class NotificationService {
  private notificationRepo: NotificationRepository;
  private supabase: SupabaseClient;
  private appUrl: string;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.notificationRepo = new NotificationRepository(supabase);
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  /**
   * Send a notification to a specific user
   */
  async send(params: {
    userId: string;
    type: NotificationType;
    context: TemplateContext;
    priority?: NotificationPriority;
    entityType?: NotificationEntityType;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationRow> {
    const content = getNotificationContent(params.type, params.context);
    const priority = params.priority || this.getDefaultPriority(params.type);

    const notification = await this.notificationRepo.create({
      user_id: params.userId,
      type: params.type,
      title: content.title,
      message: content.message,
      priority,
      action_url: content.actionUrl || null,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
    });

    this.sendExternal({
      userId: params.userId,
      notificationId: notification.id,
      content,
      priority,
      entityType: params.entityType,
      entityId: params.entityId,
    }).catch((error) => {
      console.error("[NotificationService] send() external delivery failed:", error);
    });

    return notification;
  }

  /**
   * Broadcast a notification to all admin users
   */
  async broadcast(params: {
    type: NotificationType;
    context: TemplateContext;
    priority?: NotificationPriority;
    entityType?: NotificationEntityType;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const content = getNotificationContent(params.type, params.context);
    const priority = params.priority || this.getDefaultPriority(params.type);

    const admins = await this.getAdminUsers();
    await Promise.all(
      admins.map((admin) =>
        this.notificationRepo.create({
          user_id: admin.id,
          type: params.type,
          title: content.title,
          message: content.message,
          priority,
          action_url: content.actionUrl || null,
          entity_type: params.entityType || null,
          entity_id: params.entityId || null,
          metadata: params.metadata || {},
        })
      )
    );

    this.sendExternal({
      role: "admin",
      content,
      priority,
      entityType: params.entityType,
      entityId: params.entityId,
    }).catch((error) => {
      console.error("[NotificationService] broadcast() external delivery failed:", error);
    });
  }

  /**
   * Notify all users of a specific company
   */
  async notifyCompany(params: {
    companyId: string;
    type: NotificationType;
    context: TemplateContext;
    priority?: NotificationPriority;
    entityType?: NotificationEntityType;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const content = getNotificationContent(params.type, params.context);
    const priority = params.priority || this.getDefaultPriority(params.type);

    const companyUsers = await this.getCompanyUsers(params.companyId);
    await Promise.all(
      companyUsers.map((user) =>
        this.notificationRepo.create({
          user_id: user.id,
          type: params.type,
          title: content.title,
          message: content.message,
          priority,
          action_url: content.actionUrl || null,
          entity_type: params.entityType || null,
          entity_id: params.entityId || null,
          metadata: params.metadata || {},
        })
      )
    );

    this.sendExternal({
      companyId: params.companyId,
      content,
      priority,
      entityType: params.entityType,
      entityId: params.entityId,
    }).catch((error) => {
      console.error("[NotificationService] notifyCompany() external delivery failed:", error);
    });
  }

  // ============================================
  // Event Methods
  // ============================================

  async onRequestSubmitted(params: {
    requestId: string;
    requestNumber: string;
    companyName: string;
  }): Promise<void> {
    await this.broadcast({
      type: "request_submitted",
      context: {
        requestNumber: params.requestNumber,
        companyName: params.companyName,
        entityId: params.requestId,
      },
      priority: "normal",
      entityType: "request",
      entityId: params.requestId,
    });
  }

  async onQuoteSent(params: {
    quoteId: string;
    quoteNumber: string;
    companyId: string;
    requestId: string;
  }): Promise<void> {
    await this.notifyCompany({
      companyId: params.companyId,
      type: "quote_sent",
      context: {
        quoteNumber: params.quoteNumber,
        entityId: params.requestId,
      },
      priority: "high",
      entityType: "quote",
      entityId: params.quoteId,
    });
  }

  async onQuoteAccepted(params: {
    quoteId: string;
    quoteNumber: string;
    companyName: string;
  }): Promise<void> {
    await this.broadcast({
      type: "quote_accepted",
      context: {
        quoteNumber: params.quoteNumber,
        companyName: params.companyName,
        entityId: params.quoteId,
      },
      priority: "high",
      entityType: "quote",
      entityId: params.quoteId,
    });
  }

  async onQuoteDeclined(params: {
    quoteId: string;
    quoteNumber: string;
    companyName: string;
  }): Promise<void> {
    await this.broadcast({
      type: "quote_declined",
      context: {
        quoteNumber: params.quoteNumber,
        companyName: params.companyName,
        entityId: params.quoteId,
      },
      priority: "normal",
      entityType: "quote",
      entityId: params.quoteId,
    });
  }

  async onQuoteRevisionRequested(params: {
    quoteId: string;
    quoteNumber: string;
    companyName: string;
  }): Promise<void> {
    await this.broadcast({
      type: "quote_revision_requested",
      context: {
        quoteNumber: params.quoteNumber,
        companyName: params.companyName,
        entityId: params.quoteId,
      },
      priority: "normal",
      entityType: "quote",
      entityId: params.quoteId,
    });
  }

  async onPickupScheduled(params: {
    jobId: string;
    jobNumber: string;
    companyId: string;
    scheduledDate: string;
  }): Promise<void> {
    await this.notifyCompany({
      companyId: params.companyId,
      type: "pickup_scheduled",
      context: {
        jobNumber: params.jobNumber,
        scheduledDate: params.scheduledDate,
        entityId: params.jobId,
      },
      priority: "normal",
      entityType: "job",
      entityId: params.jobId,
    });
  }

  async onPickupComplete(params: {
    jobId: string;
    jobNumber: string;
    companyId: string;
  }): Promise<void> {
    await this.notifyCompany({
      companyId: params.companyId,
      type: "pickup_complete",
      context: {
        jobNumber: params.jobNumber,
        entityId: params.jobId,
      },
      priority: "low",
      entityType: "job",
      entityId: params.jobId,
    });
  }

  async onJobComplete(params: {
    jobId: string;
    jobNumber: string;
    companyId: string;
  }): Promise<void> {
    await this.notifyCompany({
      companyId: params.companyId,
      type: "job_complete",
      context: {
        jobNumber: params.jobNumber,
        entityId: params.jobId,
      },
      priority: "high",
      entityType: "job",
      entityId: params.jobId,
    });
  }

  async onInvoiceOverdue(params: {
    invoiceId: string;
    invoiceNumber: string;
    companyId: string;
  }): Promise<void> {
    await this.notifyCompany({
      companyId: params.companyId,
      type: "invoice_overdue",
      context: {
        invoiceNumber: params.invoiceNumber,
        entityId: params.invoiceId,
      },
      priority: "high",
      entityType: "invoice",
      entityId: params.invoiceId,
    });
  }

  async onDocumentUploaded(params: {
    documentId: string;
    documentType: string;
    jobId: string;
    jobNumber: string;
    companyId: string;
  }): Promise<void> {
    await this.notifyCompany({
      companyId: params.companyId,
      type: "document_uploaded",
      context: {
        documentType: params.documentType,
        jobNumber: params.jobNumber,
        entityId: params.jobId,
      },
      priority: "normal",
      entityType: "document",
      entityId: params.documentId,
    });
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private getDefaultPriority(type: NotificationType): NotificationPriority {
    const highPriorityTypes: NotificationType[] = [
      "quote_sent",
      "quote_accepted",
      "job_complete",
      "invoice_overdue",
    ];
    const lowPriorityTypes: NotificationType[] = ["pickup_complete"];

    if (highPriorityTypes.includes(type)) return "high";
    if (lowPriorityTypes.includes(type)) return "low";
    return "normal";
  }

  private async getAdminUsers(): Promise<UserInfo[]> {
    const { data, error } = await this.supabase.rpc(
      "get_admin_users_for_notification"
    );

    if (error) throw error;
    return (data ?? []) as UserInfo[];
  }

  private async getCompanyUsers(companyId: string): Promise<UserInfo[]> {
    const { data, error } = await this.supabase.rpc(
      "get_company_users_for_notification",
      { p_company_id: companyId }
    );

    if (error) throw error;
    return (data ?? []) as UserInfo[];
  }

  private async sendExternal(params: {
    userId?: string;
    notificationId?: string;
    role?: "admin" | "client";
    companyId?: string;
    content: { title: string; message: string; actionUrl?: string };
    priority: NotificationPriority;
    entityType?: NotificationEntityType | null;
    entityId?: string | null;
  }): Promise<void> {
    try {
      const url = params.content.actionUrl
        ? `${this.appUrl}${params.content.actionUrl}`
        : undefined;
      const data = {
        notification_id: params.notificationId,
        entity_type: params.entityType,
        entity_id: params.entityId,
      };
      const emailBody = getEmailHtmlContent(params.content, this.appUrl);

      let pushResult = null;
      let emailResult = null;

      if (params.role) {
        const filters: OneSignalFilter[] = [
          { field: "tag", key: "user_role", relation: "=", value: params.role },
        ];
        pushResult = await onesignalClient.sendPushByFilter({
          filters,
          title: params.content.title,
          message: params.content.message,
          url,
          data,
          priority: params.priority,
        });
        emailResult = await onesignalClient.sendEmailByFilter({
          filters,
          subject: params.content.title,
          body: emailBody,
        });
      } else if (params.companyId) {
        const filters: OneSignalFilter[] = [
          { field: "tag", key: "company_id", relation: "=", value: params.companyId },
        ];
        pushResult = await onesignalClient.sendPushByFilter({
          filters,
          title: params.content.title,
          message: params.content.message,
          url,
          data,
          priority: params.priority,
        });
        emailResult = await onesignalClient.sendEmailByFilter({
          filters,
          subject: params.content.title,
          body: emailBody,
        });
      } else if (params.userId) {
        pushResult = await onesignalClient.sendPushNotification({
          externalUserIds: [params.userId],
          title: params.content.title,
          message: params.content.message,
          url,
          data,
          priority: params.priority,
        });
        emailResult = await onesignalClient.sendEmailNotification({
          externalUserIds: [params.userId],
          subject: params.content.title,
          body: emailBody,
        });
      }

      // Track delivery status if we have a notification ID
      if (params.notificationId) {
        if (pushResult) {
          await this.notificationRepo.markPushSent(params.notificationId);
        }
        if (emailResult) {
          await this.notificationRepo.markEmailSent(params.notificationId);
        }
      }

      console.log(
        `[NotificationService] External notification sent — push: ${!!pushResult}, email: ${!!emailResult}, target: ${params.role || params.companyId || params.userId}`
      );
    } catch (error) {
      console.error("[NotificationService] Failed to send external notification:", error);
    }
  }
}
