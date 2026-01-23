import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { validateRequest, linkInvoiceSchema } from "@/lib/validation";

/**
 * POST /api/admin/invoices/[id]/link
 *
 * Links an invoice to a specific job.
 * Pass job_id: null to unlink.
 *
 * Requires: Admin authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const validation = await validateRequest(request, linkInvoiceSchema);
    if (!validation.success) {
      return validation.response;
    }
    const { job_id } = validation.data;

    // Verify the invoice exists
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, company_id")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // If linking to a job, verify the job exists and belongs to the same company
    if (job_id) {
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, company_id")
        .eq("id", job_id)
        .single();

      if (jobError || !job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      if (job.company_id !== invoice.company_id) {
        return NextResponse.json(
          { error: "Invoice and job must belong to the same company" },
          { status: 400 }
        );
      }
    }

    // Update the invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("invoices")
      .update({ job_id })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update invoice: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Invoice link error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to link invoice",
      },
      { status: 500 }
    );
  }
}
