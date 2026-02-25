import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { validateRequest, inviteUserSchema } from "@/lib/validation";
import { onesignalClient } from "@/lib/onesignal";

/**
 * POST /api/admin/invite-user
 *
 * Invites a user to join a company. Sends them an email with a
 * link to set their password.
 *
 * Handles three scenarios:
 * 1. New user — sends invitation email
 * 2. Existing banned user (previously deactivated) — unbans, updates, sends recovery email
 * 3. Existing active user (resend) — sends recovery email so they can reset their password
 *
 * Requires: Admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the requester is an admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const validation = await validateRequest(request, inviteUserSchema);
    if (!validation.success) {
      return validation.response;
    }
    const body = validation.data;

    // Use service role client for auth admin operations
    const adminClient = createAdminClient();

    // Try to invite the user (works for new users)
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      body.email,
      {
        data: {
          full_name: body.fullName || body.email,
          role: "client",
          company_id: body.companyId,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
      }
    );

    if (error) {
      // Check if the error is because user already exists
      const isUserExists =
        error.message?.toLowerCase().includes("already") ||
        error.message?.toLowerCase().includes("registered") ||
        error.status === 422;

      if (!isUserExists) {
        console.error("Error inviting user:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // User already exists — handle re-invite
      return await handleReInvite(adminClient, body);
    }

    // Auto-register user with OneSignal for email notifications
    if (data.user?.id) {
      registerOneSignal(data.user.id, body.email, body.role || "client", body.companyId);
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id,
      message: "Invitation email sent successfully",
    });
  } catch (error) {
    console.error("Error in invite-user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handles re-inviting an existing user (banned or active).
 * Unbans if necessary, updates profile/metadata, and sends a recovery email.
 */
async function handleReInvite(
  adminClient: ReturnType<typeof createAdminClient>,
  body: { email: string; fullName?: string; companyId: string; role?: string }
) {
  // Look up existing profile
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", body.email)
    .maybeSingle();

  if (!existingProfile) {
    return NextResponse.json(
      { error: "User account is in an inconsistent state. Please contact support." },
      { status: 400 }
    );
  }

  // Unban the user and update their metadata
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    existingProfile.id,
    {
      ban_duration: "none",
      user_metadata: {
        full_name: body.fullName || body.email,
        role: "client",
        company_id: body.companyId,
      },
    }
  );

  if (updateError) {
    console.error("Error updating user:", updateError);
    return NextResponse.json(
      { error: "Failed to reactivate user" },
      { status: 500 }
    );
  }

  // Update profile record
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      company_id: body.companyId,
      full_name: body.fullName || body.email,
    })
    .eq("id", existingProfile.id);

  if (profileError) {
    console.error("Error updating profile:", profileError);
  }

  // Send a recovery email so the user can set/reset their password
  const { error: resetError } = await adminClient.auth.resetPasswordForEmail(
    body.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    }
  );

  if (resetError) {
    console.error("Error sending recovery email:", resetError);
    return NextResponse.json(
      { error: resetError.message },
      { status: 429 }
    );
  }

  // Register with OneSignal
  registerOneSignal(existingProfile.id, body.email, body.role || "client", body.companyId);

  return NextResponse.json({
    success: true,
    userId: existingProfile.id,
    message: "Invitation email re-sent successfully",
  });
}

function registerOneSignal(userId: string, email: string, role: string, companyId: string) {
  onesignalClient
    .registerUserEmail({
      externalId: userId,
      email,
      role,
      companyId,
    })
    .catch((err) => {
      console.error("[invite-user] OneSignal registration failed:", err);
    });
}
