import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/users/[id]/send-recovery-email
 *
 * Sends a password recovery email to the specified user.
 * Used by admins to let a user reset their password.
 *
 * Requires: Admin authentication
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params;

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

    const adminClient = createAdminClient();

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
      console.error("Error sending recovery email:", error);
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      message: "Password recovery email sent successfully",
    });
  } catch (error) {
    console.error("Error in send-recovery-email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
