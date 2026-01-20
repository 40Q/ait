import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { getAuthorizationUrl } from "@/lib/quickbooks/auth";
import { randomBytes } from "crypto";

/**
 * GET /api/quickbooks/connect
 *
 * Initiates the QuickBooks OAuth flow.
 * Redirects the user to QuickBooks authorization page.
 *
 * Requires: Admin authentication
 */
export async function GET() {
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
    const state = randomBytes(16).toString("hex");

    // TODO: Store state in session/cookie for validation in callback
    // For now, we'll skip state validation in the callback

    const authUrl = getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("QuickBooks connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate QuickBooks connection" },
      { status: 500 }
    );
  }
}
