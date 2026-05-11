import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

/**
 * POST /api/admin/invoices
 *
 * Manually creates an invoice for companies that don't use QuickBooks.
 * Accepts multipart/form-data with an optional PDF file.
 *
 * Fields:
 *   company_id (required)
 *   amount (required, number)
 *   invoice_date (required, YYYY-MM-DD)
 *   due_date (required, YYYY-MM-DD)
 *   status (required: unpaid | paid | overdue)
 *   job_id (optional)
 *   invoice_number (optional)
 *   pdf (optional, file)
 *
 * If invoice_number is omitted, one is auto-generated as M-0001, M-0002, ...
 * via a DB sequence.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();

    const company_id = formData.get("company_id") as string | null;
    const amountRaw = formData.get("amount") as string | null;
    const invoice_date = formData.get("invoice_date") as string | null;
    const due_date = formData.get("due_date") as string | null;
    const status = formData.get("status") as string | null;
    const job_id = formData.get("job_id") as string | null;
    const invoiceNumberInput = (formData.get("invoice_number") as string | null)?.trim() || null;
    const pdfFile = formData.get("pdf") as File | null;

    if (!company_id || !amountRaw || !invoice_date || !due_date || !status) {
      return NextResponse.json(
        { error: "company_id, amount, invoice_date, due_date, and status are required" },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 400 });
    }

    if (!["unpaid", "paid", "overdue"].includes(status)) {
      return NextResponse.json({ error: "status must be unpaid, paid, or overdue" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Upload PDF if provided
    let pdf_path: string | null = null;
    if (pdfFile && pdfFile.size > 0) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const fileName = `${crypto.randomUUID()}.pdf`;
      // We'll store under a temp path first, then move after we have the invoice ID
      const tempPath = `temp/${fileName}`;

      const { error: uploadError } = await adminClient.storage
        .from("invoices")
        .upload(tempPath, buffer, { contentType: "application/pdf", upsert: false });

      if (uploadError) {
        console.error("[admin/invoices] PDF upload failed:", uploadError.message);
        return NextResponse.json({ error: "Failed to upload PDF" }, { status: 500 });
      }

      pdf_path = tempPath;
    }

    // Use user-provided invoice number if given, else generate via DB sequence
    let invoiceNumber: string;
    if (invoiceNumberInput) {
      invoiceNumber = invoiceNumberInput;
    } else {
      const { data: invoiceNumberData, error: seqError } = await adminClient
        .rpc("next_manual_invoice_number");

      if (seqError || !invoiceNumberData) {
        console.error("[admin/invoices] Failed to generate invoice number:", seqError?.message);
        if (pdf_path) await adminClient.storage.from("invoices").remove([pdf_path]);
        return NextResponse.json({ error: "Failed to generate invoice number" }, { status: 500 });
      }
      invoiceNumber = invoiceNumberData as string;
    }

    // Insert invoice
    const { data: invoice, error: insertError } = await adminClient
      .from("invoices")
      .insert({
        company_id,
        invoice_number: invoiceNumber,
        amount,
        invoice_date,
        due_date,
        status,
        job_id: job_id || null,
        pdf_path,
        quickbooks_id: null,
      })
      .select("id")
      .single();

    if (insertError) {
      // Clean up uploaded file on insert failure
      if (pdf_path) {
        await adminClient.storage.from("invoices").remove([pdf_path]);
      }
      console.error("[admin/invoices] Insert failed:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Move the file to its final path under the invoice ID
    if (pdf_path && invoice) {
      const finalPath = `${invoice.id}/invoice.pdf`;
      const { error: moveError } = await adminClient.storage
        .from("invoices")
        .move(pdf_path, finalPath);

      if (moveError) {
        console.error("[admin/invoices] PDF move failed:", moveError.message);
        // Non-fatal: invoice is created, just update path in DB
      } else {
        await adminClient
          .from("invoices")
          .update({ pdf_path: finalPath })
          .eq("id", invoice.id);
        pdf_path = finalPath;
      }
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice?.id,
    });
  } catch (err) {
    console.error("POST /api/admin/invoices:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
