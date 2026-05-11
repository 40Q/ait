import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/invoices/[id]/pdf
 *
 * Downloads the manually uploaded PDF for an invoice from Supabase Storage.
 * Accessible by admins, managers (for their sub-companies), and clients with invoice_access.
 * Auth is enforced by storage RLS — this route just proxies the download.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const inline = url.searchParams.get("disposition") === "inline";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch invoice to get pdf_path (RLS ensures the user can only see invoices they have access to)
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, pdf_path")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (!invoice.pdf_path) {
      return NextResponse.json({ error: "No PDF available for this invoice" }, { status: 400 });
    }

    // Use admin client to download from storage (bypasses storage RLS, but we've already
    // verified the user can access the invoice via the invoices table RLS above)
    const adminClient = createAdminClient();
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("invoices")
      .download(invoice.pdf_path);

    if (downloadError || !fileData) {
      console.error("[admin/invoices/pdf] Download failed:", downloadError?.message);
      return NextResponse.json({ error: "Failed to download PDF" }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const disposition = inline ? "inline" : "attachment";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="invoice-${invoice.invoice_number}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/invoices/[id]/pdf:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
