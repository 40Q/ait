import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/helpers";
import { getValidAccessToken } from "@/lib/quickbooks/auth";
import { QuickBooksClient, getInvoiceStatus } from "@/lib/quickbooks/client";

interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

/**
 * POST /api/quickbooks/sync-invoices
 *
 * Syncs all invoices from QuickBooks to the local database.
 * Matches invoices to companies via quickbooks_customer_id.
 *
 * Requires: Admin authentication
 */
export async function POST() {
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

    // Fetch all invoices from QuickBooks
    const qbInvoices = await client.getInvoices();

    // Get all companies with QuickBooks customer IDs
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, quickbooks_customer_id")
      .not("quickbooks_customer_id", "is", null);

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`);
    }

    // Create a map of QuickBooks customer ID to company ID
    const customerIdToCompanyId = new Map<string, string>();
    for (const company of companies || []) {
      if (company.quickbooks_customer_id) {
        customerIdToCompanyId.set(company.quickbooks_customer_id, company.id);
      }
    }

    const result: SyncResult = {
      synced: 0,
      skipped: 0,
      errors: [],
    };

    // Process each invoice
    for (const qbInvoice of qbInvoices) {
      try {
        const customerId = qbInvoice.CustomerRef.value;
        const companyId = customerIdToCompanyId.get(customerId);

        if (!companyId) {
          result.skipped++;
          continue;
        }

        const status = getInvoiceStatus(qbInvoice.Balance, qbInvoice.DueDate);

        // Upsert invoice
        const { error: upsertError } = await supabase.from("invoices").upsert(
          {
            quickbooks_id: qbInvoice.Id,
            invoice_number: qbInvoice.DocNumber || `QB-${qbInvoice.Id}`,
            company_id: companyId,
            amount: qbInvoice.TotalAmt,
            status,
            invoice_date: qbInvoice.TxnDate,
            due_date: qbInvoice.DueDate,
            quickbooks_synced_at: new Date().toISOString(),
            quickbooks_data: qbInvoice,
          },
          {
            onConflict: "quickbooks_id",
          }
        );

        if (upsertError) {
          result.errors.push(
            `Invoice ${qbInvoice.DocNumber}: ${upsertError.message}`
          );
        } else {
          result.synced++;
        }
      } catch (error) {
        result.errors.push(
          `Invoice ${qbInvoice.DocNumber}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return NextResponse.json({
      success: true,
      result,
      totalFromQuickBooks: qbInvoices.length,
    });
  } catch (error) {
    console.error("Invoice sync error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to sync invoices",
      },
      { status: 500 }
    );
  }
}
