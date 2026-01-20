import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { getValidAccessToken } from "@/lib/quickbooks/auth";
import { QuickBooksClient } from "@/lib/quickbooks/client";

/**
 * GET /api/quickbooks/invoice/[id]/pdf
 *
 * Downloads an invoice PDF from QuickBooks.
 * The [id] parameter is the local invoice ID (UUID).
 *
 * Access control:
 * - Admins can download any invoice
 * - Clients can only download invoices for their company
 */
export async function GET(
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

    // Fetch the invoice from our database
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, companies!inner(id)")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check access: admin can access all, client can only access their company's invoices
    const userIsAdmin = await isAdmin(supabase, user.id);

    if (!userIsAdmin) {
      // Get user's company
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!userProfile?.company_id || userProfile.company_id !== invoice.company_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Check if invoice has a QuickBooks ID
    if (!invoice.quickbooks_id) {
      return NextResponse.json(
        { error: "Invoice not synced from QuickBooks" },
        { status: 400 }
      );
    }

    // Get valid access token
    const tokenInfo = await getValidAccessToken(supabase);
    if (!tokenInfo) {
      return NextResponse.json(
        { error: "QuickBooks not connected" },
        { status: 400 }
      );
    }

    const client = new QuickBooksClient(
      tokenInfo.accessToken,
      tokenInfo.realmId
    );

    // Fetch PDF from QuickBooks
    const pdfBuffer = await client.getInvoicePdf(invoice.quickbooks_id);

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Invoice PDF download error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to download invoice",
      },
      { status: 500 }
    );
  }
}
