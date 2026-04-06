import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isManager } from "@/lib/auth/helpers";

/**
 * GET /api/manager/companies
 * Lists all sub-companies belonging to the manager's company.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isManager(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // RLS handles the filtering — returns only sub-companies of this manager's company
    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, name, contact_email, phone, city, state, status, created_at")
      .not("parent_company_id", "is", null)
      .order("name");

    if (error) throw error;

    return NextResponse.json(companies);
  } catch (error) {
    console.error("GET /api/manager/companies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/manager/companies
 * Creates a new sub-company under the manager's company.
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

    // Get manager's company_id
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: "Manager has no associated company" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, contact_email, phone, address, city, state, zip } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        name: name.trim(),
        contact_email: contact_email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        status: "active",
        parent_company_id: profile.company_id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A company with this name already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("POST /api/manager/companies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
