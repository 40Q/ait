import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isManager } from "@/lib/auth/helpers";
import { NotificationService } from "@/lib/database/services/notification.service";

/**
 * POST /api/manager/users/[id]/invoice-access
 *
 * Grants or revokes invoice access for a sub-company user.
 * Body: { grant: boolean }
 *
 * Requires: Manager authentication. Target user must belong to
 * a sub-company owned by this manager.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isManager(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const grant: boolean = body.grant ?? true;

    const adminClient = createAdminClient();

    // Get manager's company
    const { data: managerProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    // Get target user's company
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership — target must be in a sub-company of this manager
    const { data: targetCompany } = await adminClient
      .from("companies")
      .select("parent_company_id")
      .eq("id", targetProfile.company_id)
      .single();

    if (!targetCompany || targetCompany.parent_company_id !== managerProfile?.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await adminClient
      .from("profiles")
      .update({ invoice_access: grant, invoice_access_requested: false })
      .eq("id", userId);

    if (error) throw error;

    if (grant) {
      const notificationService = new NotificationService(adminClient);
      notificationService.onInvoiceAccessGranted({ userId }).catch((error) => {
        console.error("Failed to send invoice access granted notification:", error);
      });
    }

    return NextResponse.json({
      success: true,
      invoice_access: grant,
      message: grant ? "Invoice access granted" : "Invoice access revoked",
    });
  } catch (error) {
    console.error("POST /api/manager/users/[id]/invoice-access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
