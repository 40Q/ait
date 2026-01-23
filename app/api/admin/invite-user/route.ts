import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/helpers";
import { validateRequest, inviteUserSchema } from "@/lib/validation";

/**
 * POST /api/admin/invite-user
 *
 * Invites a user to join a company. Sends them an email with a
 * link to set their password.
 *
 * Requires: Admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the requester is an admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const validation = await validateRequest(request, inviteUserSchema);
    if (!validation.success) {
      return validation.response;
    }
    const body = validation.data;

    // Use admin client to invite the user
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      body.email,
      {
        data: {
          full_name: body.fullName || body.email,
          role: "client",
          company_id: body.companyId,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
      }
    );

    if (error) {
      console.error("Error inviting user:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id,
      message: "Invitation email sent successfully",
    });
  } catch (error) {
    console.error("Error in invite-user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
