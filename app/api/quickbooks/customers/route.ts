import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { getValidAccessToken } from "@/lib/quickbooks/auth";
import { QuickBooksClient } from "@/lib/quickbooks/client";

/**
 * GET /api/quickbooks/customers
 *
 * Search or list QuickBooks customers.
 * Query params:
 *   - search: Search term for filtering customers by name
 *
 * Requires: Admin authentication
 */
export async function GET(request: NextRequest) {
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

    // Get valid access token
    const tokenInfo = await getValidAccessToken(supabase);
    if (!tokenInfo) {
      return NextResponse.json(
        { error: "QuickBooks not connected" },
        { status: 400 }
      );
    }

    const client = new QuickBooksClient(
      tokenInfo.accessToken,
      tokenInfo.realmId
    );

    const searchTerm = request.nextUrl.searchParams.get("search");

    let customers;
    if (searchTerm && searchTerm.length >= 2) {
      customers = await client.searchCustomers(searchTerm);
    } else {
      // Return all customers if no search term (for initial load)
      customers = await client.getCustomers();
    }

    // Transform to a simpler format for the frontend
    const results = customers.map((customer) => ({
      id: customer.Id,
      displayName: customer.DisplayName,
      companyName: customer.CompanyName,
      email: customer.PrimaryEmailAddr?.Address,
    }));

    return NextResponse.json({ customers: results });
  } catch (error) {
    console.error("QuickBooks customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
