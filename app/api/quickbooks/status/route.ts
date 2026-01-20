import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { getStoredTokens, getValidAccessToken } from "@/lib/quickbooks/auth";
import { QuickBooksClient } from "@/lib/quickbooks/client";

/**
 * GET /api/quickbooks/status
 *
 * Returns the current QuickBooks connection status.
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

    const tokens = await getStoredTokens(supabase);

    if (!tokens) {
      return NextResponse.json({
        connected: false,
        realmId: null,
        lastSync: null,
      });
    }

    // Check if we can get a valid access token
    const validToken = await getValidAccessToken(supabase);

    if (!validToken) {
      return NextResponse.json({
        connected: false,
        realmId: tokens.realm_id,
        error: "Token expired, please reconnect",
        lastSync: null,
      });
    }

    // Test the connection
    const client = new QuickBooksClient(
      validToken.accessToken,
      validToken.realmId
    );
    const isConnected = await client.testConnection();

    return NextResponse.json({
      connected: isConnected,
      realmId: tokens.realm_id,
      tokenExpiresAt: tokens.access_token_expires_at,
      refreshTokenExpiresAt: tokens.refresh_token_expires_at,
      lastSync: tokens.updated_at,
    });
  } catch (error) {
    console.error("QuickBooks status error:", error);
    return NextResponse.json(
      { error: "Failed to check QuickBooks status" },
      { status: 500 }
    );
  }
}
