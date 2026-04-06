import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isManager } from "@/lib/auth/helpers";

/**
 * GET /api/manager/companies/[id]/users
 * Lists active portal users for a sub-company owned by the manager.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isManager(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the company is a sub-company of this manager's company
    const adminClient = createAdminClient();
    const { data: managerProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const { data: company } = await adminClient
      .from("companies")
      .select("parent_company_id")
      .eq("id", id)
      .single();

    if (!company || company.parent_company_id !== managerProfile?.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all profiles for this sub-company
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, email, full_name, invoice_access, invoice_access_requested")
      .eq("company_id", id);

    if (!profiles?.length) {
      return NextResponse.json([]);
    }

    // Check auth state (banned / invite pending) for each user
    const usersWithStatus = await Promise.all(
      profiles.map(async (profile) => {
        const { data: authData } = await adminClient.auth.admin.getUserById(profile.id);
        const authUser = authData?.user;

        const isBanned =
          authUser?.banned_until &&
          authUser.banned_until !== "none" &&
          new Date(authUser.banned_until) > new Date();

        if (isBanned) return null;

        const invitePending = !authUser?.confirmed_at;

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          invite_pending: invitePending,
          invoice_access: profile.invoice_access ?? false,
          invoice_access_requested: profile.invoice_access_requested ?? false,
        };
      })
    );

    return NextResponse.json(usersWithStatus.filter(Boolean));
  } catch (error) {
    console.error("GET /api/manager/companies/[id]/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
