import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { onesignalClient, getEmailHtmlContent } from "@/lib/onesignal";
import { sendExternalNotificationSchema } from "@/lib/validation/schemas";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

/**
 * POST /api/notifications/send-external
 *
 * Sends push and email notifications via OneSignal.
 * Supports three targeting modes:
 * - userId: Send to a specific user
 * - role: Send to all users with a specific role (uses tag filter)
 * - companyId: Send to all users in a company (uses tag filter)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const apiKey = request.headers.get("x-internal-api-key");
    const hasValidApiKey = INTERNAL_API_KEY && apiKey === INTERNAL_API_KEY;

    if (!hasValidApiKey) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const rawBody = await request.json();
    const parseResult = sendExternalNotificationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const body = parseResult.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const url = body.actionUrl ? `${appUrl}${body.actionUrl}` : undefined;
    const data = {
      notification_id: body.notificationId,
      entity_type: body.entityType,
      entity_id: body.entityId,
    };

    let pushResult = null;
    let emailResult = null;

    if (body.role) {
      const filters = [
        {
          field: "tag" as const,
          key: "user_role",
          relation: "=" as const,
          value: body.role,
        },
      ];

      pushResult = await onesignalClient.sendPushByFilter({
        filters,
        title: body.title,
        message: body.message,
        url,
        data,
        priority: body.priority,
      });

      emailResult = await onesignalClient.sendEmailByFilter({
        filters,
        subject: body.title,
        body: getEmailHtmlContent(
          { title: body.title, message: body.message, actionUrl: body.actionUrl },
          appUrl
        ),
      });
    } else if (body.companyId) {
      const filters = [
        {
          field: "tag" as const,
          key: "company_id",
          relation: "=" as const,
          value: body.companyId,
        },
      ];

      pushResult = await onesignalClient.sendPushByFilter({
        filters,
        title: body.title,
        message: body.message,
        url,
        data,
        priority: body.priority,
      });

      emailResult = await onesignalClient.sendEmailByFilter({
        filters,
        subject: body.title,
        body: getEmailHtmlContent(
          { title: body.title, message: body.message, actionUrl: body.actionUrl },
          appUrl
        ),
      });
    } else if (body.userId) {
      pushResult = await onesignalClient.sendPushNotification({
        externalUserIds: [body.userId],
        title: body.title,
        message: body.message,
        url,
        data,
        priority: body.priority,
      });

      emailResult = await onesignalClient.sendEmailNotification({
        externalUserIds: [body.userId],
        subject: body.title,
        body: getEmailHtmlContent(
          { title: body.title, message: body.message, actionUrl: body.actionUrl },
          appUrl
        ),
      });

      if (body.notificationId) {
        if (pushResult) {
          await supabase
            .from("notifications")
            .update({ push_sent: true, push_sent_at: new Date().toISOString() })
            .eq("id", body.notificationId);
        }
        if (emailResult) {
          await supabase
            .from("notifications")
            .update({ email_sent: true, email_sent_at: new Date().toISOString() })
            .eq("id", body.notificationId);
        }
      }
    }

    return NextResponse.json({
      pushSent: !!pushResult,
      emailSent: !!emailResult,
      recipients: pushResult?.recipients || 0,
    });
  } catch (error) {
    console.error("[send-external] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
