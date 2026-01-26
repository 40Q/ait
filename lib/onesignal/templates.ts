import type { NotificationContent } from './types';
import type { NotificationType } from '@/lib/database/types';

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

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

const templates: Record<
  NotificationType,
  (ctx: TemplateContext) => NotificationContent
> = {
  request_submitted: (ctx) => ({
    title: 'New Request Submitted',
    message: `A new pickup request${ctx.requestNumber ? ` #${ctx.requestNumber}` : ''} has been submitted${ctx.companyName ? ` by ${ctx.companyName}` : ''}.`,
    actionUrl: ctx.entityId ? `/admin/requests/${ctx.entityId}` : '/admin/requests',
  }),

  quote_sent: (ctx) => ({
    title: 'Quote Ready for Review',
    message: `Your quote${ctx.quoteNumber ? ` #${ctx.quoteNumber}` : ''} is ready for review.`,
    actionUrl: ctx.entityId ? `/requests/${ctx.entityId}` : '/requests',
  }),

  quote_accepted: (ctx) => ({
    title: 'Quote Accepted',
    message: `Quote${ctx.quoteNumber ? ` #${ctx.quoteNumber}` : ''}${ctx.companyName ? ` from ${ctx.companyName}` : ''} has been accepted.`,
    actionUrl: ctx.entityId ? `/admin/quotes/${ctx.entityId}` : '/admin/quotes',
  }),

  quote_declined: (ctx) => ({
    title: 'Quote Declined',
    message: `Quote${ctx.quoteNumber ? ` #${ctx.quoteNumber}` : ''}${ctx.companyName ? ` from ${ctx.companyName}` : ''} has been declined.`,
    actionUrl: ctx.entityId ? `/admin/quotes/${ctx.entityId}` : '/admin/quotes',
  }),

  quote_revision_requested: (ctx) => ({
    title: 'Quote Revision Requested',
    message: `A revision has been requested for quote${ctx.quoteNumber ? ` #${ctx.quoteNumber}` : ''}${ctx.companyName ? ` by ${ctx.companyName}` : ''}.`,
    actionUrl: ctx.entityId ? `/admin/quotes/${ctx.entityId}` : '/admin/quotes',
  }),

  pickup_scheduled: (ctx) => ({
    title: 'Pickup Scheduled',
    message: `Your pickup${ctx.jobNumber ? ` for job #${ctx.jobNumber}` : ''} has been scheduled${ctx.scheduledDate ? ` for ${ctx.scheduledDate}` : ''}.`,
    actionUrl: ctx.entityId ? `/jobs/${ctx.entityId}` : '/jobs',
  }),

  pickup_complete: (ctx) => ({
    title: 'Pickup Complete',
    message: `The pickup${ctx.jobNumber ? ` for job #${ctx.jobNumber}` : ''} has been completed. Processing will begin shortly.`,
    actionUrl: ctx.entityId ? `/jobs/${ctx.entityId}` : '/jobs',
  }),

  job_complete: (ctx) => ({
    title: 'Job Complete',
    message: `Job${ctx.jobNumber ? ` #${ctx.jobNumber}` : ''} has been completed. Your documents are ready for download.`,
    actionUrl: ctx.entityId ? `/jobs/${ctx.entityId}` : '/jobs',
  }),

  invoice_overdue: (ctx) => ({
    title: 'Invoice Overdue',
    message: `Invoice${ctx.invoiceNumber ? ` #${ctx.invoiceNumber}` : ''} is overdue. Please review and process payment.`,
    actionUrl: ctx.entityId ? `/invoices/${ctx.entityId}` : '/invoices',
  }),

  document_uploaded: (ctx) => ({
    title: 'New Document Available',
    message: `A new ${ctx.documentType || 'document'}${ctx.jobNumber ? ` for job #${ctx.jobNumber}` : ''} has been uploaded.`,
    actionUrl: ctx.entityId ? `/jobs/${ctx.entityId}` : '/jobs',
  }),
};

export function getNotificationContent(
  type: NotificationType,
  context: TemplateContext
): NotificationContent {
  const template = templates[type];
  return template(context);
}

export function getEmailHtmlContent(content: NotificationContent, appUrl: string): string {
  const safeTitle = escapeHtml(content.title);
  const safeMessage = escapeHtml(content.message);

  const actionLink = content.actionUrl
    ? `<p style="margin-top: 20px;"><a href="${escapeHtml(appUrl)}${escapeHtml(content.actionUrl)}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a></p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 32px; margin-bottom: 20px;">
          <h1 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">${safeTitle}</h1>
          <p style="margin: 0; color: #475569; font-size: 16px;">${safeMessage}</p>
          ${actionLink}
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          AIT Electronics Recycling<br>
          You're receiving this email because you have notifications enabled.
        </p>
      </body>
    </html>
  `;
}
