import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { exchangeCodeForTokens, storeTokens } from "@/lib/quickbooks/auth";

/**
 * GET /api/quickbooks/callback
 *
 * Handles the OAuth callback from QuickBooks.
 * Exchanges the authorization code for tokens and stores them.
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
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", request.url)
      );
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.redirect(
        new URL("/admin?error=forbidden", request.url)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const realmId = searchParams.get("realmId");
    const error = searchParams.get("error");

    if (error) {
      console.error("QuickBooks OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          `/admin/settings/quickbooks?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code || !realmId) {
      return NextResponse.redirect(
        new URL(
          "/admin/settings/quickbooks?error=missing_params",
          request.url
        )
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Store tokens in database
    await storeTokens(
      supabase,
      realmId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
      tokens.x_refresh_token_expires_in
    );

    return NextResponse.redirect(
      new URL("/admin/settings/quickbooks?success=connected", request.url)
    );
  } catch (error) {
    console.error("QuickBooks callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/admin/settings/quickbooks?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
      )
    );
  }
}
