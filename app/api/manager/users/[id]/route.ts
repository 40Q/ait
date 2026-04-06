import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isManager } from "@/lib/auth/helpers";

/**
 * POST /api/manager/users/[id]
 *
 * Removes a user by banning them. The target user must belong to a
 * sub-company owned by the requesting manager. Data is preserved;
 * the user can be re-invited later.
 *
 * Requires: Manager authentication
 */
export async function POST(
  _request: NextRequest,
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

    const adminClient = createAdminClient();

    // Get manager's company_id
    const { data: managerProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    // Get target user's company
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("email, company_id")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the target user belongs to a sub-company of this manager
    const { data: targetCompany } = await adminClient
      .from("companies")
      .select("parent_company_id")
      .eq("id", targetProfile.company_id)
      .single();

    if (!targetCompany || targetCompany.parent_company_id !== managerProfile?.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: banError } = await adminClient.auth.admin.updateUserById(
      userId,
      { ban_duration: "876600h" } // ~100 years
    );

    if (banError) {
      return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User removed successfully",
      email: targetProfile.email,
    });
  } catch (error) {
    console.error("POST /api/manager/users/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
