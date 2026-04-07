import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation";

/**
 * POST /api/auth/request-new-link
 *
 * Resends an invite to a user who landed on an expired invitation link.
 * Validates server-side that the user exists and has NOT confirmed their
 * account — so even if someone submits an arbitrary email it will do nothing.
 *
 * Always returns 200 to prevent email enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body.email);

    if (!parsed.success) return NextResponse.json({ success: true });

    const email = parsed.data;
    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!profile) return NextResponse.json({ success: true });

    const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id);

    // Only resend if the user exists and has NOT confirmed their account yet
    if (!authUser?.user || authUser.user.confirmed_at) return NextResponse.json({ success: true });

    // Same flow as admin "Resend Invite": send a recovery email so the user can
    // set their password. Note: do NOT call generateLink after this — it would
    // overwrite the token just emailed to the user, making their link invalid.
    const { error } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    });

    if (error) {
      console.error("[request-new-link] Failed to send email:", error.message);
    }
  } catch (err) {
    console.error("[request-new-link] Unexpected error:", err);
  }

  return NextResponse.json({ success: true });
}
