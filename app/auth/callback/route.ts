import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * After an email change is fully confirmed, sync the new email
 * to the profiles table and update full_name if it was the old email.
 */
async function syncEmailChangeToProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const newEmail = user.email;
  if (!newEmail) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) return;

  // Nothing to sync if emails already match
  if (profile.email === newEmail) return;

  const oldEmail = profile.email;
  const updates: { email: string; full_name?: string } = { email: newEmail };

  // If the display name was the old email, update it to the new email
  if (profile.full_name === oldEmail) {
    updates.full_name = newEmail;

    // Also update the auth user metadata display name
    await supabase.auth.updateUser({
      data: { full_name: newEmail },
    });
  }

  await supabase.from("profiles").update(updates).eq("id", user.id);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  // Handle token-based auth (invite, recovery, etc.)
  const tokenHash = searchParams.get("token_hash");
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "invite" | "recovery" | "email" | "email_change",
    });

    if (!error) {
      // For invite or recovery, redirect to set password
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/set-password`);
      }

      // For email change confirmations, sync profile and redirect to settings with a message
      if (type === "email_change") {
        await syncEmailChangeToProfile(supabase);

        const { data: { user } } = await supabase.auth.getUser();
        const emailChanged = user?.email_confirmed_at && !user?.new_email;

        if (emailChanged) {
          // Both emails confirmed — change is complete
          const message = encodeURIComponent("Your email address has been updated successfully.");
          return NextResponse.redirect(`${origin}/settings?email_confirmed=${message}`);
        } else {
          // First email confirmed — still waiting for the other one
          const message = encodeURIComponent("Email confirmed. Please check your other email inbox to complete the change.");
          return NextResponse.redirect(`${origin}/settings?email_confirmed=${message}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Handle PKCE code exchange
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      // Check if this is an invite flow (type param might be in the original redirect)
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(
          isLocalEnv
            ? `${origin}/auth/set-password`
            : forwardedHost
              ? `https://${forwardedHost}/auth/set-password`
              : `${origin}/auth/set-password`
        );
      }

      // For email change via PKCE flow
      if (type === "email_change") {
        await syncEmailChangeToProfile(supabase);

        const { data: { user } } = await supabase.auth.getUser();
        const emailChanged = user?.email_confirmed_at && !user?.new_email;

        const baseUrl = isLocalEnv
          ? origin
          : forwardedHost
            ? `https://${forwardedHost}`
            : origin;

        if (emailChanged) {
          const message = encodeURIComponent("Your email address has been updated successfully.");
          return NextResponse.redirect(`${baseUrl}/settings?email_confirmed=${message}`);
        } else {
          const message = encodeURIComponent("Email confirmed. Please check your other email inbox to complete the change.");
          return NextResponse.redirect(`${baseUrl}/settings?email_confirmed=${message}`);
        }
      }

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
