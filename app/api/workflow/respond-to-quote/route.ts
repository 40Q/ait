import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WorkflowService } from "@/lib/database/services/workflow.service";
import { z } from "zod";

const schema = z.object({
  quoteId: z.string().uuid(),
  response: z.object({
    status: z.enum(["accepted", "declined", "revision_requested"]),
    revision_message: z.string().optional(),
    decline_reason: z.string().optional(),
    signature_name: z.string().optional(),
  }),
});

/**
 * POST /api/workflow/respond-to-quote
 * Client action: accept, decline, or request revision of a quote.
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

    const body = await request.json();
    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { quoteId, response } = parseResult.data;
    const workflow = new WorkflowService(supabase);
    const result = await workflow.respondToQuote(quoteId, response, user.id);

    return NextResponse.json({ success: true, jobId: result.jobId });
  } catch (error) {
    console.error("[workflow/respond-to-quote] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
