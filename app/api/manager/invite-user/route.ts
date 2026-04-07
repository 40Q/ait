import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isManager } from "@/lib/auth/helpers";
import { onesignalClient } from "@/lib/onesignal";

/**
 * POST /api/manager/invite-user
 *
 * Invites a user to a sub-company. The companyId must be a sub-company
 * of the manager's own company. Invited users always get the "client" role.
 *
 * Mirrors the logic in /api/admin/invite-user but scoped to manager's sub-companies.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isManager(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, fullName, companyId, password } = body;

    if (!email || !companyId) {
      return NextResponse.json(
        { error: "email and companyId are required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify the target company belongs to this manager
    const { data: managerProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const { data: targetCompany } = await adminClient
      .from("companies")
      .select("parent_company_id")
      .eq("id", companyId)
      .single();

    if (!targetCompany || targetCompany.parent_company_id !== managerProfile?.company_id) {
      return NextResponse.json(
        { error: "You can only invite users to your own sub-companies" },
        { status: 403 }
      );
    }

    const userMetadata = {
      full_name: fullName || email,
      role: "client",
      company_id: companyId,
    };

    // If a password is provided, create the account directly (no invite email)
    if (password) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (error) {
        const isUserExists =
          error.message?.toLowerCase().includes("already") ||
          error.message?.toLowerCase().includes("registered") ||
          error.status === 422;

        if (!isUserExists) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return await handleReInviteWithPassword(adminClient, { email, fullName, companyId, password });
      }

      if (data.user?.id) {
        onesignalClient
          .registerUserEmail({ externalId: data.user.id, email, role: "client", companyId })
          .catch((err) => console.error("[manager/invite-user] OneSignal registration failed:", err));
      }

      return NextResponse.json({
        success: true,
        userId: data.user?.id,
        message: "Account created successfully",
      });
    }

    // No password — send invite email
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        data: userMetadata,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
      }
    );

    if (error) {
      const isUserExists =
        error.message?.toLowerCase().includes("already") ||
        error.message?.toLowerCase().includes("registered") ||
        error.status === 422;

      if (!isUserExists) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return await handleReInvite(adminClient, { email, fullName, companyId });
    }

    if (data.user?.id) {
      onesignalClient
        .registerUserEmail({
          externalId: data.user.id,
          email,
          role: "client",
          companyId,
        })
        .catch((err) => {
          console.error("[manager/invite-user] OneSignal registration failed:", err);
        });
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id,
      message: "Invitation email sent successfully",
    });
  } catch (error) {
    console.error("POST /api/manager/invite-user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleReInviteWithPassword(
  adminClient: ReturnType<typeof createAdminClient>,
  body: { email: string; fullName?: string; companyId: string; password: string }
) {
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", body.email.toLowerCase().trim())
    .maybeSingle();

  if (!existingProfile) {
    return NextResponse.json(
      { error: "User account is in an inconsistent state. Please contact support." },
      { status: 400 }
    );
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    existingProfile.id,
    {
      ban_duration: "none",
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.fullName || body.email,
        role: "client",
        company_id: body.companyId,
      },
    }
  );

  if (updateError) {
    return NextResponse.json({ error: "Failed to update user account" }, { status: 500 });
  }

  await adminClient
    .from("profiles")
    .update({ company_id: body.companyId, full_name: body.fullName || body.email })
    .eq("id", existingProfile.id);

  onesignalClient
    .registerUserEmail({ externalId: existingProfile.id, email: body.email, role: "client", companyId: body.companyId })
    .catch((err) => console.error("[manager/invite-user] OneSignal registration failed:", err));

  return NextResponse.json({
    success: true,
    userId: existingProfile.id,
    message: "Account updated successfully",
  });
}

async function handleReInvite(
  adminClient: ReturnType<typeof createAdminClient>,
  body: { email: string; fullName?: string; companyId: string }
) {
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", body.email.toLowerCase().trim())
    .maybeSingle();

  if (!existingProfile) {
    return NextResponse.json(
      { error: "User account is in an inconsistent state. Please contact support." },
      { status: 400 }
    );
  }

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
    return NextResponse.json({ error: "Failed to reactivate user" }, { status: 500 });
  }

  await adminClient
    .from("profiles")
    .update({ company_id: body.companyId, full_name: body.fullName || body.email })
    .eq("id", existingProfile.id);

  // Note: do NOT call generateLink after this — it would overwrite the token
  // just emailed to the user, making their link invalid.
  const { error: resetError } = await adminClient.auth.resetPasswordForEmail(
    body.email.toLowerCase().trim(),
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    }
  );

  if (resetError) {
    return NextResponse.json({ error: resetError.message }, { status: 429 });
  }

  onesignalClient
    .registerUserEmail({
      externalId: existingProfile.id,
      email: body.email,
      role: "client",
      companyId: body.companyId,
    })
    .catch((err) => {
      console.error("[manager/invite-user] OneSignal re-invite registration failed:", err);
    });

  return NextResponse.json({
    success: true,
    userId: existingProfile.id,
    message: "Invitation email re-sent successfully",
  });
}
