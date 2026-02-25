import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RequestRepository } from "@/lib/database/repositories";
import { NotificationService } from "@/lib/database/services/notification.service";
import type { RequestInsert } from "@/lib/database/types";

/**
 * POST /api/workflow/submit-request
 * Client action: creates a new pickup request.
 * Triggers push + email notifications to all admin users.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RequestInsert = await request.json();

    const repo = new RequestRepository(supabase);
    const created = await repo.create(body);

    // Send notification to admins about the new request
    try {
      const notificationService = new NotificationService(supabase);

      // Get company name for the notification
      let companyName = "Unknown Company";
      if (created.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select("name")
          .eq("id", created.company_id)
          .single();
        if (company?.name) {
          companyName = company.name;
        }
      }

      await notificationService.onRequestSubmitted({
        requestId: created.id,
        requestNumber: created.request_number,
        companyName,
      });
    } catch (notifError) {
      console.error(
        "[workflow/submit-request] Notification failed (request was still created):",
        notifError
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[workflow/submit-request] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
