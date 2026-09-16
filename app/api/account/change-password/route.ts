import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createClient as createSupabaseClient,
  type AuthError,
} from "@supabase/supabase-js";
import { z } from "zod";
import { validateRequest } from "@/lib/validation";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain a special character"
      ),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

/**
 * Throwaway Supabase client used only to check a password.
 *
 * It must never share state with the caller's cookie-backed client: signing in
 * there would rotate/clobber the session the subsequent updateUser() call
 * depends on. Session persistence is disabled so the resulting session lives
 * and dies inside this request.
 */
function createVerifierClient(key: string) {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Captcha rejections come from the captcha middleware, not the credentials. */
function isCaptchaError(error: AuthError) {
  return /captcha/i.test(error.message);
}

/**
 * Verifies the user's current password server-side.
 *
 * Returns true only when the password is correct. The publishable key is tried
 * first so the attempt goes through normal auth rate limiting. If the project
 * has captcha protection enabled on the auth endpoints, that request is
 * rejected before the password is ever checked (the browser's captcha token is
 * single-use and already spent on the client-side check), so we retry with the
 * secret key, which the auth server exempts from captcha.
 */
async function verifyCurrentPassword(
  email: string,
  password: string
): Promise<boolean> {
  const { error } = await createVerifierClient(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  ).auth.signInWithPassword({ email, password });

  if (!error) return true;
  if (!isCaptchaError(error)) return false;

  const { error: secretKeyError } = await createVerifierClient(
    process.env.SUPABASE_SECRET_KEY!
  ).auth.signInWithPassword({ email, password });

  return !secretKeyError;
}

export async function POST(request: Request) {
  try {
    const validation = await validateRequest(request, changePasswordSchema);
    if (!validation.success) return validation.response;

    const { currentPassword, newPassword } = validation.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Account has no email address to verify against" },
        { status: 400 }
      );
    }

    // Reauthenticate: a stolen session alone must not be enough to take over
    // the account. The client does this too, but that check is skippable.
    if (!(await verifyCurrentPassword(user.email, currentPassword))) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
