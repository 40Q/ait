import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * After an email change is fully confirmed, sync the new email
 * to the profiles table and update full_name if it was the old email.
 */
async function syncEmailChangeToProfile(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
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

    await supabase.auth.updateUser({
      data: { full_name: newEmail },
    });
  }

  await supabase.from("profiles").update(updates).eq("id", user.id);
}

function getBaseUrl(request: Request, origin: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) return origin;
  if (forwardedHost) return `https://${forwardedHost}`;
  return origin;
}

function settingsRedirect(baseUrl: string, message: string): NextResponse {
  return NextResponse.redirect(
    `${baseUrl}/settings?email_confirmed=${encodeURIComponent(message)}`
  );
}

async function handleEmailChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseUrl: string
): Promise<NextResponse> {
  await syncEmailChangeToProfile(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const emailChangeComplete = user?.email_confirmed_at && !user?.new_email;

  if (emailChangeComplete) {
    return settingsRedirect(
      baseUrl,
      "Your email address has been updated successfully."
    );
  }

  return settingsRedirect(
    baseUrl,
    "Email confirmed. Please check your other email inbox to complete the change."
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const baseUrl = getBaseUrl(request, origin);

  // Handle token-based auth (invite, recovery, etc.)
  const tokenHash = searchParams.get("token_hash");
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "invite" | "recovery" | "email" | "email_change",
    });

    if (!error) {
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/set-password`);
      }

      if (type === "email_change") {
        return handleEmailChange(supabase, baseUrl);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    // If email_change verification fails, the change may still have been
    // applied by Supabase's server. Sync the profile and redirect gracefully.
    if (type === "email_change") {
      await syncEmailChangeToProfile(supabase);
      return settingsRedirect(
        baseUrl,
        "Email confirmation processed. Please check your account email below."
      );
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Handle PKCE code exchange
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${baseUrl}/auth/set-password`);
      }

      if (type === "email_change") {
        return handleEmailChange(supabase, baseUrl);
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }

    // PKCE exchange can fail for email_change because there's no code verifier
    // cookie (the confirmation link comes from an email, not a browser flow).
    // The change was already applied by Supabase's server — sync and redirect.
    if (type === "email_change") {
      await syncEmailChangeToProfile(supabase);
      return settingsRedirect(
        baseUrl,
        "Email confirmation processed. Please check your account email below."
      );
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
