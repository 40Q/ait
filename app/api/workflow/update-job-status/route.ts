import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { WorkflowService } from "@/lib/database/services/workflow.service";
import { z } from "zod";

const schema = z.object({
  jobId: z.string().uuid(),
  status: z.string().min(1),
});

/**
 * POST /api/workflow/update-job-status
 * Admin action: updates a job's status.
 * Triggers push + email notifications to the company's users.
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

    const admin = await isAdmin(supabase, user.id);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { jobId, status } = parseResult.data;
    const workflow = new WorkflowService(supabase);
    const job = await workflow.updateJobStatus(jobId, status);

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("[workflow/update-job-status] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
