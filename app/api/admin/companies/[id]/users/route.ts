import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/companies/[id]/users
 *
 * Returns active (non-banned) users for a company.
 * Checks the actual banned status from Supabase Auth.
 *
 * Requires: Admin authentication
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: companyId } = await params;

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

    // Get all profiles for this company
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("company_id", companyId)
      .order("email", { ascending: true });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json([]);
    }

    // Check auth status for each user (requires service role key)
    const adminClient = createAdminClient();
    const activeUsers = [];

    for (const profile of profiles) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(
        profile.id
      );

      // Only include users that are not banned
      if (authUser?.user && !authUser.user.banned_until) {
        activeUsers.push({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
        });
      }
    }

    return NextResponse.json(activeUsers);
  } catch (error) {
    console.error("Error fetching company users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
