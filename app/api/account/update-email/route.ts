import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { validateRequest } from "@/lib/validation";

const updateEmailSchema = z.object({
  newEmail: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .transform((val) => val.toLowerCase().trim()),
});

export async function POST(request: Request) {
  try {
    const validation = await validateRequest(request, updateEmailSchema);
    if (!validation.success) return validation.response;

    const { newEmail } = validation.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.email === newEmail) {
      return NextResponse.json(
        { error: "New email is the same as your current email" },
        { status: 400 }
      );
    }

    // Build the redirect URL for email confirmation links
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    // Supabase will send a confirmation email to the new address
    const { error: updateError } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${origin}/settings` }
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "A confirmation email has been sent to your new email address. Please check your inbox to complete the change.",
    });
  } catch (error) {
    console.error("Error updating email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
