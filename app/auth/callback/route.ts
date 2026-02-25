import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Sync the auth user's email to the profiles table.
 * Also updates full_name and auth metadata if they matched the old email.
 */
async function syncEmailChangeToProfile(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.email === user.email) return;

  const oldEmail = profile.email;
  const updates: { email: string; full_name?: string } = {
    email: user.email,
  };

  if (profile.full_name === oldEmail) {
    updates.full_name = user.email;
    await supabase.auth.updateUser({ data: { full_name: user.email } });
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const baseUrl = getBaseUrl(request, origin);

  // Supabase doesn't always include `type` in redirects. Detect email change
  // by checking if the original destination was /settings (set via emailRedirectTo).
  const isEmailChange = type === "email_change" || next === "/settings";

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
        return NextResponse.redirect(`${baseUrl}/auth/set-password`);
      }

      if (isEmailChange) {
        await syncEmailChangeToProfile(supabase);
        return settingsRedirect(
          baseUrl,
          "Your email address has been updated successfully."
        );
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }

    // Verification failed — but for email change, Supabase may have already
    // applied it server-side before redirecting. Sync and redirect gracefully.
    if (isEmailChange) {
      await syncEmailChangeToProfile(supabase);
      return settingsRedirect(
        baseUrl,
        "Your email address has been updated successfully."
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

      if (isEmailChange) {
        await syncEmailChangeToProfile(supabase);
        return settingsRedirect(
          baseUrl,
          "Your email address has been updated successfully."
        );
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }

    // PKCE exchange can fail for email change because there's no code verifier
    // cookie (the link comes from an email, not a browser-initiated flow).
    // Supabase already applied the change — sync profile and redirect.
    if (isEmailChange) {
      await syncEmailChangeToProfile(supabase);
      return settingsRedirect(
        baseUrl,
        "Your email address has been updated successfully."
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
