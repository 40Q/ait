import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NotificationRepository } from "@/lib/database/repositories/notifications";

/**
 * POST /api/client/request-invoice-access
 *
 * Allows a sub-company client to request invoice access from their manager.
 * Creates a notification for all manager-role users in the parent company.
 *
 * Requires: Client authentication with a company that has a parent_company_id
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get requesting user's profile + company
    const { data: requesterProfile } = await adminClient
      .from("profiles")
      .select("full_name, email, company_id, role")
      .eq("id", user.id)
      .single();

    if (!requesterProfile || requesterProfile.role !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!requesterProfile.company_id) {
      return NextResponse.json({ error: "No company associated with your account" }, { status: 400 });
    }

    // Get requester's company to find parent
    const { data: requesterCompany } = await adminClient
      .from("companies")
      .select("name, parent_company_id")
      .eq("id", requesterProfile.company_id)
      .single();

    if (!requesterCompany?.parent_company_id) {
      return NextResponse.json(
        { error: "Invoice access requests are only available to sub-company users" },
        { status: 400 }
      );
    }

    // Find all managers in the parent company
    const { data: managers } = await adminClient
      .from("profiles")
      .select("id")
      .eq("company_id", requesterCompany.parent_company_id)
      .eq("role", "manager");

    if (!managers?.length) {
      return NextResponse.json(
        { error: "No manager found for your organization. Please contact support." },
        { status: 404 }
      );
    }

    // Mark the user as having requested access
    await adminClient
      .from("profiles")
      .update({ invoice_access_requested: true })
      .eq("id", user.id);

    // Create a notification for each manager
    const notificationRepo = new NotificationRepository(adminClient);
    const requesterName = requesterProfile.full_name || requesterProfile.email;

    await Promise.all(
      managers.map((manager) =>
        notificationRepo.create({
          user_id: manager.id,
          type: "invoice_access_requested",
          title: "Invoice Access Request",
          message: `${requesterName} from ${requesterCompany.name} is requesting access to view invoices.`,
          priority: "normal",
          action_url: `/manager/companies/${requesterProfile.company_id}`,
          entity_type: null,
          entity_id: null,
          metadata: {
            requester_id: user.id,
            requester_email: requesterProfile.email,
            requester_name: requesterName,
            company_id: requesterProfile.company_id,
            company_name: requesterCompany.name,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Access request sent to your manager",
    });
  } catch (error) {
    console.error("POST /api/client/request-invoice-access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
