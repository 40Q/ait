import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { getAuthorizationUrl } from "@/lib/quickbooks/auth";
import { randomBytes } from "crypto";

// Cookie name for OAuth state
export const QB_STATE_COOKIE = "qb_oauth_state";

/**
 * GET /api/quickbooks/connect
 *
 * Initiates the QuickBooks OAuth flow.
 * Redirects the user to QuickBooks authorization page.
 *
 * Requires: Admin authentication
 */
export async function GET(request: NextRequest) {
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

    // Generate a random state parameter for CSRF protection
    const state = randomBytes(32).toString("hex");

    const authUrl = getAuthorizationUrl(state);

    // Create response with redirect
    const response = NextResponse.redirect(authUrl);

    // Store state in an HTTP-only cookie for validation in callback
    response.cookies.set(QB_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("QuickBooks connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate QuickBooks connection" },
      { status: 500 }
    );
  }
}
