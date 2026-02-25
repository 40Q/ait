import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/account/sync-email
 *
 * Syncs the auth user's email to the profiles table.
 * Also updates full_name if it matched the old email.
 * Called after an email change confirmation.
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

    const newEmail = user.email;
    if (!newEmail) {
      return NextResponse.json({ synced: false });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.email === newEmail) {
      return NextResponse.json({ synced: false });
    }

    const oldEmail = profile.email;
    const updates: { email: string; full_name?: string } = { email: newEmail };

    // If the display name was the old email, update it to the new email
    if (profile.full_name === oldEmail) {
      updates.full_name = newEmail;

      await supabase.auth.updateUser({
        data: { full_name: newEmail },
      });
    }

    await supabase.from("profiles").update(updates).eq("id", user.id);

    return NextResponse.json({ synced: true });
  } catch (error) {
    console.error("Error syncing email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
