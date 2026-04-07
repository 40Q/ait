import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isManager } from "@/lib/auth/helpers";

/**
 * POST /api/manager/users/[id]/set-password
 *
 * Sets a new password for a user belonging to a sub-company managed
 * by the requesting manager.
 *
 * Requires: Manager authentication
 * Body: { password: string }
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
    const { password } = body;

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify the target user belongs to a sub-company of this manager
    const { data: managerProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: targetCompany } = await adminClient
      .from("companies")
      .select("parent_company_id")
      .eq("id", targetProfile.company_id)
      .single();

    if (!targetCompany || targetCompany.parent_company_id !== managerProfile?.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      console.error("Error setting password:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("POST /api/manager/users/[id]/set-password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
