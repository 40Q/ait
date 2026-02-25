import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/companies/[id]/deactivate
 *
 * Permanently deletes a company and all associated data.
 * - Deletes the company record (cascades to requests, quotes, jobs, documents, invoices, locations)
 * - Deletes all auth users linked to the company (cascades to profiles, notifications)
 *
 * Requires: Admin authentication
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: companyId } = await params;

    // Verify the requester is an admin
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

    // Get all users associated with this company BEFORE deleting
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("company_id", companyId);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch company users" },
        { status: 500 }
      );
    }

    const adminClient = createAdminClient();

    // Delete the company — cascades to all business data
    // (requests, quotes, jobs, documents, invoices, locations)
    const { error: deleteError } = await adminClient
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (deleteError) {
      console.error("Error deleting company:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete company" },
        { status: 500 }
      );
    }

    // Delete all auth users — cascades to profiles, notifications, preferences
    const deletedUsers: string[] = [];
    const failedUsers: string[] = [];

    for (const profile of profiles || []) {
      const { error: deleteUserError } =
        await adminClient.auth.admin.deleteUser(profile.id);

      if (deleteUserError) {
        console.error(
          `Error deleting user ${profile.email}:`,
          deleteUserError
        );
        failedUsers.push(profile.email);
      } else {
        deletedUsers.push(profile.email);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
      deletedUsers: deletedUsers.length,
      failedUsers: failedUsers.length > 0 ? failedUsers : undefined,
    });
  } catch (error) {
    console.error("Error in delete company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
