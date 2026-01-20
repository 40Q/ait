import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/quickbooks/auth";
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
  console.log("=== QuickBooks Webhook Received ===");
  try {
    const payload = await request.text();
    const signature = request.headers.get("intuit-signature") || "";

    console.log("Webhook payload:", payload);
    console.log("Webhook signature:", signature);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.warn("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("Webhook signature verified!");

    const data: WebhookPayload = JSON.parse(payload);

    // Create an admin client for database operations (bypasses RLS)
    const supabase = createAdminClient();

    // Process each notification
    for (const notification of data.eventNotifications) {
      const { realmId, dataChangeEvent } = notification;

      // Get tokens for this realm
      const { data: tokenData } = await supabase
        .from("quickbooks_tokens")
        .select("*")
        .eq("realm_id", realmId)
        .single();

      if (!tokenData) {
        console.warn(`No tokens found for realm: ${realmId}`);
        continue;
      }

      // Check if token is still valid (basic check)
      const tokenExpiry = new Date(tokenData.access_token_expires_at);
      if (tokenExpiry < new Date()) {
        console.warn(`Token expired for realm: ${realmId}`);
        continue;
      }

      const client = new QuickBooksClient(
        tokenData.access_token,
        tokenData.realm_id
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
          // Delete the invoice from our database
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
          } catch (error) {
            console.error(`Failed to sync invoice ${entity.id}:`, error);
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
