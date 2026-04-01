import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
      type: type as "invite" | "recovery" | "email",
    });

    if (!error) {
      // For invite or recovery, redirect to set password
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/set-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    // For expired invite links, pass the email so the error page can offer a resend.
    // The server validates the email before showing the option.
    if (type === "invite") {
      const email = searchParams.get("email");
      const dest = new URL(`${origin}/auth/auth-code-error`);
      if (email) dest.searchParams.set("email", email);
      return NextResponse.redirect(dest);
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

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    // PKCE exchange failed — treat like an expired invite if we have the context
    if (type === "invite") {
      const email = searchParams.get("email");
      const dest = new URL(`${origin}/auth/auth-code-error`);
      if (email) dest.searchParams.set("email", email);
      return NextResponse.redirect(dest);
    }
  }

  // Return the user to an error page with instructions
  // Preserve email for expired invite links so the error page can offer a resend
  const errorDest = new URL(`${origin}/auth/auth-code-error`);
  const fallbackEmail = searchParams.get("email");
  if (type === "invite" && fallbackEmail) {
    errorDest.searchParams.set("email", fallbackEmail);
  }
  return NextResponse.redirect(errorDest);
}
