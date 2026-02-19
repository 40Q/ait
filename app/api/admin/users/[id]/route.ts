import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/users/[id]/deactivate
 *
 * Deactivates a user by banning them in Supabase Auth.
 * The user will no longer be able to log in, but all data is preserved.
 *
 * Requires: Admin authentication
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params;

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

    // Get user info for response
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Ban the user (prevents login but preserves all data, requires service role key)
    const adminClient = createAdminClient();
    const { error: banError } = await adminClient.auth.admin.updateUserById(
      userId,
      { ban_duration: "876600h" } // ~100 years
    );

    if (banError) {
      console.error(`Error deactivating user ${profile.email}:`, banError);
      return NextResponse.json(
        { error: "Failed to deactivate user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
      email: profile.email,
    });
  } catch (error) {
    console.error("Error in deactivate user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
