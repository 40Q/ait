import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { exchangeCodeForTokens, storeTokens } from "@/lib/quickbooks/auth";
import { QB_STATE_COOKIE } from "../connect/route";
import { timingSafeEqual } from "crypto";

/**
 * GET /api/quickbooks/callback
 *
 * Handles the OAuth callback from QuickBooks.
 * Exchanges the authorization code for tokens and stores them.
 *
 * Requires: Admin authentication
 */
export async function GET(request: NextRequest) {
  // Helper to create redirect response that clears the state cookie
  const redirectWithClearCookie = (url: URL) => {
    const response = NextResponse.redirect(url);
    response.cookies.delete(QB_STATE_COOKIE);
    return response;
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirectWithClearCookie(
        new URL("/login?error=unauthorized", request.url)
      );
    }

    if (!(await isAdmin(supabase, user.id))) {
      return redirectWithClearCookie(
        new URL("/admin?error=forbidden", request.url)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const realmId = searchParams.get("realmId");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Validate CSRF state parameter
    const storedState = request.cookies.get(QB_STATE_COOKIE)?.value;

    if (!storedState || !state) {
      return redirectWithClearCookie(
        new URL("/admin/settings?error=invalid_state", request.url)
      );
    }

    // Use timing-safe comparison to prevent timing attacks
    const stateBuffer = Buffer.from(state);
    const storedStateBuffer = Buffer.from(storedState);

    if (
      stateBuffer.length !== storedStateBuffer.length ||
      !timingSafeEqual(stateBuffer, storedStateBuffer)
    ) {
      return redirectWithClearCookie(
        new URL("/admin/settings?error=invalid_state", request.url)
      );
    }

    if (error) {
      console.error("QuickBooks OAuth error:", error);
      return redirectWithClearCookie(
        new URL("/admin/settings?error=oauth_denied", request.url)
      );
    }

    if (!code || !realmId) {
      return redirectWithClearCookie(
        new URL("/admin/settings?error=missing_params", request.url)
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

    return redirectWithClearCookie(
      new URL("/admin/settings?success=quickbooks_connected", request.url)
    );
  } catch (error) {
    console.error("QuickBooks callback error:", error);
    return NextResponse.redirect(
      new URL("/admin/settings?error=connection_failed", request.url)
    );
  }
}
