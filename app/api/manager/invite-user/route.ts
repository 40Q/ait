import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isManager } from "@/lib/auth/helpers";
import { assertManagerOwnsCompany, isSubCompanyOf } from "@/lib/auth/manager-scope";
import { registerUserEmailAfterResponse } from "@/lib/onesignal";

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
    const scope = await assertManagerOwnsCompany(adminClient, user.id, companyId);

    if (!scope.ok) {
      return NextResponse.json(
        { error: "You can only invite users to your own sub-companies" },
        { status: 403 }
      );
    }

    const managerCompanyId = scope.managerCompanyId;

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

        return await handleReInviteWithPassword(adminClient, managerCompanyId, { email, fullName, companyId, password });
      }

      if (data.user?.id) {
        registerUserEmailAfterResponse({
          externalId: data.user.id,
          email,
          role: "client",
          companyId,
        });
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

      return await handleReInvite(adminClient, managerCompanyId, { email, fullName, companyId });
    }

    if (data.user?.id) {
      registerUserEmailAfterResponse({
        externalId: data.user.id,
        email,
        role: "client",
        companyId,
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
  managerCompanyId: string,
  body: { email: string; fullName?: string; companyId: string; password: string }
) {
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id, role, company_id")
    .eq("email", body.email.toLowerCase().trim())
    .maybeSingle();

  if (!existingProfile) {
    return NextResponse.json(
      { error: "User account is in an inconsistent state. Please contact support." },
      { status: 400 }
    );
  }

  if (!(await isExistingUserInManagerScope(adminClient, managerCompanyId, existingProfile))) {
    return NextResponse.json(
      { error: "You can only manage users in your own sub-companies" },
      { status: 403 }
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

  registerUserEmailAfterResponse({
    externalId: existingProfile.id,
    email: body.email,
    role: "client",
    companyId: body.companyId,
  });

  return NextResponse.json({
    success: true,
    userId: existingProfile.id,
    message: "Account updated successfully",
  });
}

async function handleReInvite(
  adminClient: ReturnType<typeof createAdminClient>,
  managerCompanyId: string,
  body: { email: string; fullName?: string; companyId: string }
) {
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id, role, company_id")
    .eq("email", body.email.toLowerCase().trim())
    .maybeSingle();

  if (!existingProfile) {
    return NextResponse.json(
      { error: "User account is in an inconsistent state. Please contact support." },
      { status: 400 }
    );
  }

  if (!(await isExistingUserInManagerScope(adminClient, managerCompanyId, existingProfile))) {
    return NextResponse.json(
      { error: "You can only manage users in your own sub-companies" },
      { status: 403 }
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

  registerUserEmailAfterResponse({
    externalId: existingProfile.id,
    email: body.email,
    role: "client",
    companyId: body.companyId,
  });

  return NextResponse.json({
    success: true,
    userId: existingProfile.id,
    message: "Invitation email re-sent successfully",
  });
}

/**
 * A re-invite overwrites credentials on an existing account, so the existing
 * account must already be a client inside one of this manager's sub-companies.
 * Without this, a manager could re-invite an admin's email and take over that
 * account (the profiles.role column, which drives isAdmin(), is never changed
 * by the re-invite path).
 */
async function isExistingUserInManagerScope(
  adminClient: ReturnType<typeof createAdminClient>,
  managerCompanyId: string,
  existingProfile: { role: string | null; company_id: string | null }
) {
  if (existingProfile.role !== "client") {
    return false;
  }

  return await isSubCompanyOf(adminClient, managerCompanyId, existingProfile.company_id);
}
