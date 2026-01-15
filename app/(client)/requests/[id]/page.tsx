"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RequestDetails } from "./_components/request-details";
import { QuoteReview } from "./_components/quote-review";
import { useRequest, useQuoteByRequestId } from "@/lib/hooks";
import { formatDate, formatDateTime } from "@/lib/utils/date";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = use(params);
  const { data: request, isLoading, error } = useRequest(id);
  const { data: quote } = useQuoteByRequestId(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">
          {error ? `Failed to load request: ${error.message}` : "Request not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/requests">Back to Requests</Link>
        </Button>
      </div>
    );
  }

  const hasQuote = request.status !== "pending" && quote;
  const defaultTab = request.status === "quote_ready" ? "quote" : "details";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{request.request_number}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted on {formatDateTime(request.created_at)}
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="details">Request Details</TabsTrigger>
          <TabsTrigger value="quote" disabled={!hasQuote}>
            Quote
            {request.status === "quote_ready" && (
              <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <RequestDetails request={request} />
        </TabsContent>

        <TabsContent value="quote" className="mt-4">
          {hasQuote && (
            <QuoteReview
              quote={{
                id: quote.quote_number,
                issuedAt: formatDate(quote.created_at),
                validUntil: quote.valid_until ? formatDate(quote.valid_until) : "N/A",
                pickupDate: quote.pickup_date ? formatDate(quote.pickup_date) : "TBD",
                pickupTimeWindow: quote.pickup_time_window || "TBD",
                lineItems: quote.line_items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unit_price,
                  total: item.total,
                })),
                subtotal: quote.subtotal,
                discount: quote.discount || 0,
                total: quote.total,
                terms: quote.terms || "",
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
