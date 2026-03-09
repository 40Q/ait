import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/users/[id]/invite-link
 *
 * Generates a shareable invitation link for a user without sending an email.
 * Uses invite type for users who haven't confirmed yet, recovery for active users.
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

    const linkType = authUser.user.confirmed_at ? "recovery" : "invite";
    const redirectType = linkType === "invite" ? "invite" : "recovery";

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: linkType,
      email: authUser.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=${redirectType}`,
      },
    });

    if (error) {
      console.error("Error generating invite link:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      inviteLink: data.properties?.action_link,
    });
  } catch (error) {
    console.error("Error in invite-link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
