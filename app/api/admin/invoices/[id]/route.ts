import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

/**
 * DELETE /api/admin/invoices/[id]
 *
 * Deletes an invoice and its associated PDF (if any).
 * Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { data: invoice, error: fetchError } = await adminClient
      .from("invoices")
      .select("id, pdf_path")
      .eq("id", id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { error: deleteError } = await adminClient
      .from("invoices")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[admin/invoices DELETE] DB delete failed:", deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    if (invoice.pdf_path) {
      const { error: storageError } = await adminClient.storage
        .from("invoices")
        .remove([invoice.pdf_path]);

      if (storageError) {
        // Non-fatal — the DB row is already gone
        console.error("[admin/invoices DELETE] Storage cleanup failed:", storageError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/invoices/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
