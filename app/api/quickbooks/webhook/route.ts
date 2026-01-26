import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyWebhookSignature, getValidAccessTokenForRealm } from "@/lib/quickbooks/auth";
import { QuickBooksClient, getInvoiceStatus } from "@/lib/quickbooks/client";

interface WebhookPayload {
  eventNotifications: Array<{
    realmId: string;
    dataChangeEvent: {
      entities: Array<{
        name: string;
        id: string;
        operation: "Create" | "Update" | "Delete" | "Merge" | "Void";
        lastUpdated: string;
      }>;
    };
  }>;
}

/**
 * POST /api/quickbooks/webhook
 *
 * Receives webhook notifications from QuickBooks.
 * Updates invoice data in real-time when changes occur.
 *
 * Note: Uses service role client since this is a server-to-server call.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("intuit-signature") || "";

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data: WebhookPayload = JSON.parse(payload);

    // Create client for database operations
    const supabase = await createClient();

    // Process each notification
    for (const notification of data.eventNotifications) {
      const { realmId, dataChangeEvent } = notification;

      // Get valid access token for this realm (refreshes if expired)
      const tokenInfo = await getValidAccessTokenForRealm(supabase, realmId);

      if (!tokenInfo) {
        console.error(`No valid tokens for realm ${realmId}`);
        continue;
      }

      const client = new QuickBooksClient(
        tokenInfo.accessToken,
        tokenInfo.realmId
      );

      // Get companies map
      const { data: companies } = await supabase
        .from("companies")
        .select("id, quickbooks_customer_id")
        .not("quickbooks_customer_id", "is", null);

      const customerIdToCompanyId = new Map<string, string>();
      for (const company of companies || []) {
        if (company.quickbooks_customer_id) {
          customerIdToCompanyId.set(company.quickbooks_customer_id, company.id);
        }
      }

      // Process invoice changes
      for (const entity of dataChangeEvent.entities) {
        if (entity.name !== "Invoice") continue;

        if (entity.operation === "Delete" || entity.operation === "Void") {
          await supabase
            .from("invoices")
            .delete()
            .eq("quickbooks_id", entity.id);
        } else {
          // Fetch and upsert the invoice
          try {
            const qbInvoice = await client.getInvoice(entity.id);
            const customerId = qbInvoice.CustomerRef.value;
            const companyId = customerIdToCompanyId.get(customerId);

            if (!companyId) continue;

            const status = getInvoiceStatus(
              qbInvoice.Balance,
              qbInvoice.DueDate
            );

            await supabase.from("invoices").upsert(
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
          } catch {
            // Invoice fetch failed - may have been deleted
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Still return 200 to prevent QuickBooks from retrying
    return NextResponse.json({ success: false, error: "Processing error" });
  }
}

/**
 * GET /api/quickbooks/webhook
 *
 * QuickBooks sends a GET request to verify the webhook endpoint.
 * We need to respond with a challenge response.
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("challenge");

  if (challenge) {
    // QuickBooks is verifying the endpoint
    return new NextResponse(challenge, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ status: "Webhook endpoint active" });
}
