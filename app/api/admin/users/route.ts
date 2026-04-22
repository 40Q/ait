import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";

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
