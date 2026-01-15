import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/companies/[id]/deactivate
 *
 * Deactivates a company and removes all associated users.
 * - Sets company status to 'inactive'
 * - Deletes all auth users linked to the company
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

    // Get all users associated with this company
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

    // Update company status to inactive
    const { error: updateError } = await supabase
      .from("companies")
      .update({ status: "inactive" })
      .eq("id", companyId);

    if (updateError) {
      console.error("Error updating company:", updateError);
      return NextResponse.json(
        { error: "Failed to deactivate company" },
        { status: 500 }
      );
    }

    // Delete all users associated with this company using admin API
    const adminClient = createAdminClient();
    const deletedUsers: string[] = [];
    const failedUsers: string[] = [];

    for (const profile of profiles || []) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(
        profile.id
      );

      if (deleteError) {
        console.error(`Error deleting user ${profile.email}:`, deleteError);
        failedUsers.push(profile.email);
      } else {
        deletedUsers.push(profile.email);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Company deactivated successfully",
      deletedUsers: deletedUsers.length,
      failedUsers: failedUsers.length > 0 ? failedUsers : undefined,
    });
  } catch (error) {
    console.error("Error in deactivate company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
