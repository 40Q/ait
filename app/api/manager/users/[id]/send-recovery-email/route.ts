import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isManager } from "@/lib/auth/helpers";

/**
 * POST /api/manager/users/[id]/send-recovery-email
 *
 * Sends a password recovery email to a user belonging to a sub-company
 * managed by the requesting manager.
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

    const { data: authUser, error: userError } =
      await adminClient.auth.admin.getUserById(userId);

    if (userError || !authUser?.user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error } = await adminClient.auth.resetPasswordForEmail(
      authUser.user.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/manager/users/[id]/send-recovery-email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
