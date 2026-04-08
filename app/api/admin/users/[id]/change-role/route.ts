import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

/**
 * PATCH /api/admin/users/[id]/change-role
 *
 * Changes a user's role. Updates both the profiles table and auth user_metadata
 * so the role is consistent everywhere.
 *
 * Body: { role: "client" | "manager" | "admin" }
 */
export async function PATCH(
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

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!["client", "manager", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "role must be client, manager, or admin" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Update profiles table
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (profileError) {
      console.error("[change-role] Profile update failed:", profileError.message);
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }

    // Keep auth user_metadata in sync
    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

    if (authError) {
      console.error("[change-role] Auth metadata update failed:", authError.message);
      // Non-fatal — profile is the source of truth, but log it
    }

    return NextResponse.json({ success: true, role });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id]/change-role:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
