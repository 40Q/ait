import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { validateRequest, createAdminUserSchema } from "@/lib/validation";
import { registerUserEmailAfterResponse } from "@/lib/onesignal";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .eq("role", "admin")
      .order("email", { ascending: true });

    if (error) {
      console.error("Error fetching admin profiles:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json([]);
    }

    const adminClient = createAdminClient();
    const result = [];

    for (const profile of profiles) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id);
      if (authUser?.user && !authUser.user.banned_until) {
        result.push({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          invite_pending: !authUser.user.confirmed_at,
          last_sign_in_at: authUser.user.last_sign_in_at ?? null,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 *
 * Creates a brand new admin account. If a password is supplied the account is
 * created directly, otherwise an invitation email is sent.
 *
 * The role is always "admin" and the company is always null — neither is ever
 * read from the request body, so this endpoint cannot mint anything else.
 * Existing accounts are never touched: a duplicate email is rejected with 409.
 *
 * Requires: Admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validation = await validateRequest(request, createAdminUserSchema);
    if (!validation.success) {
      return validation.response;
    }
    const body = validation.data;

    const adminClient = createAdminClient();

    // Role and company are hardcoded — never sourced from the request body.
    const userMetadata = {
      full_name: body.fullName || body.email,
      role: "admin",
      company_id: null,
    };

    // If a password is provided, create the account directly (no invite email)
    if (body.password) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (error) {
        if (isExistingUserError(error)) {
          return NextResponse.json(
            { error: "A user with that email already exists" },
            { status: 409 }
          );
        }

        console.error("Error creating admin user:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.user?.id) {
        registerUserEmailAfterResponse({
          externalId: data.user.id,
          email: body.email,
          role: "admin",
        });
      }

      return NextResponse.json({
        success: true,
        userId: data.user?.id,
        message: "Admin account created successfully",
      });
    }

    // No password provided — send invite email
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      body.email,
      {
        data: userMetadata,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite&email=${encodeURIComponent(body.email)}`,
      }
    );

    if (error) {
      if (isExistingUserError(error)) {
        return NextResponse.json(
          { error: "A user with that email already exists" },
          { status: 409 }
        );
      }

      console.error("Error inviting admin user:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user?.id) {
      registerUserEmailAfterResponse({
        externalId: data.user.id,
        email: body.email,
        role: "admin",
      });
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id,
      message: "Invitation email sent successfully",
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** True when Supabase rejected the call because the email is already taken. */
function isExistingUserError(error: { message?: string; status?: number }) {
  return (
    error.message?.toLowerCase().includes("already") ||
    error.message?.toLowerCase().includes("registered") ||
    error.status === 422
  );
}
