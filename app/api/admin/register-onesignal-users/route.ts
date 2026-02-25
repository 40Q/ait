import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { onesignalClient } from "@/lib/onesignal";

/**
 * POST /api/admin/register-onesignal-users
 *
 * Bulk-registers all existing users with OneSignal for email notifications.
 * Run once to backfill users created before auto-registration was added.
 * Requires admin authentication.
 */
export async function POST() {
  try {
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

    // Get all profiles with their email, role, and company_id
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, role, company_id");

    if (error) {
      throw error;
    }

    let registered = 0;
    let failed = 0;

    for (const profile of profiles ?? []) {
      const success = await onesignalClient.registerUserEmail({
        externalId: profile.id,
        email: profile.email,
        role: profile.role,
        companyId: profile.company_id ?? undefined,
      });

      if (success) {
        registered++;
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      total: profiles?.length ?? 0,
      registered,
      failed,
    });
  } catch (error) {
    console.error("[register-onesignal-users] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
