import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { deleteTokens } from "@/lib/quickbooks/auth";

/**
 * POST /api/quickbooks/disconnect
 *
 * Disconnects from QuickBooks by deleting stored tokens.
 *
 * Requires: Admin authentication
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

    await deleteTokens(supabase);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("QuickBooks disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect from QuickBooks" },
      { status: 500 }
    );
  }
}
