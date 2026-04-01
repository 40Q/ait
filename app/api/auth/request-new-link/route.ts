import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation";

/**
 * POST /api/auth/request-new-link
 *
 * Public endpoint — allows users with expired invite/recovery links to
 * request a new one by submitting their email address.
 *
 * Always returns 200 to prevent email enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body.email);

    if (!parsed.success) {
      // Return 200 to avoid leaking info about what's valid
      return NextResponse.json({ success: true });
    }

    const email = parsed.data;
    const adminClient = createAdminClient();

    // Look up the user by email
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      // No user found — return success anyway to prevent enumeration
      return NextResponse.json({ success: true });
    }

    // Check if user's email is confirmed
    const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id);
    const isConfirmed = !!authUser?.user?.confirmed_at;

    if (isConfirmed) {
      // Send a recovery email so they can reset their password
      await adminClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
      });
    } else {
      // Re-send the invite email
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    // Always return success to prevent enumeration
    return NextResponse.json({ success: true });
  }
}
