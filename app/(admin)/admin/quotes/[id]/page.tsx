"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Pencil,
  Building2,
  FileText,
  MessageSquare,
  Loader2,
  Briefcase,
} from "lucide-react";
import { useQuote, useSendQuote, useJobByQuoteId } from "@/lib/hooks";
import { Timeline } from "@/components/ui/timeline";
import type { QuoteStatus } from "@/lib/database/types";

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const config: Record<
    QuoteStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    draft: { label: "Draft", variant: "secondary" },
    sent: { label: "Awaiting Response", variant: "default" },
    accepted: { label: "Accepted", variant: "default" },
    declined: { label: "Declined", variant: "destructive" },
    revision_requested: { label: "Revision Requested", variant: "outline" },
  };

  const { label, variant } = config[status];

  return (
    <Badge
      variant={variant}
      className={
        status === "accepted"
          ? "bg-green-100 text-green-800 hover:bg-green-100"
          : status === "revision_requested"
          ? "border-orange-300 text-orange-700 bg-orange-50"
          : ""
      }
    >
      {label}
    </Badge>
  );
}

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = use(params);
  const { data: quote, isLoading, error } = useQuote(id);
  const sendQuote = useSendQuote();
  const { data: job } = useJobByQuoteId(quote?.status === "accepted" ? quote?.id : undefined);

  const handleSendQuote = () => {
    if (!quote) return;
    sendQuote.mutate(quote.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">
          {error ? `Failed to load quote: ${error.message}` : "Quote not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/quotes">Back to Quotes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/quotes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {new Date(quote.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {/* Send button - only for draft and revision_requested */}
        {(quote.status === "draft" || quote.status === "revision_requested") && (
          <Button onClick={handleSendQuote} disabled={sendQuote.isPending}>
            {sendQuote.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {quote.status === "revision_requested" ? "Resend to Client" : "Send to Client"}
          </Button>
        )}
        {/* Edit button - always available for admins */}
        <Button variant="outline" asChild>
          <Link href={`/admin/quotes/${quote.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Quote
          </Link>
        </Button>
      </div>

      {/* Revision Message Alert */}
      {quote.status === "revision_requested" && quote.revision_message && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <MessageSquare className="h-4 w-4" />
              Client Revision Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-900">{quote.revision_message}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Details */}
          <Card>
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between h-full">
                <CardTitle>Quote Details</CardTitle>
                <Badge variant="outline">
                  Valid until {new Date(quote.valid_until).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Line Items */}
              <div>
                <h4 className="font-medium mb-4">Pricing Breakdown</h4>
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">
                          Description
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.line_items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${quote.subtotal.toFixed(2)}</span>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${quote.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Terms */}
              {quote.terms && (
                <div>
                  <h4 className="font-medium mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {quote.terms}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company & Request */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Company
                </p>
                <Link
                  href={`/admin/companies/${quote.company.id}`}
                  className="font-medium hover:underline"
                >
                  {quote.company.name}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Request
                </p>
                <Link
                  href={`/admin/requests/${quote.request.id}`}
                  className="font-mono text-sm hover:underline"
                >
                  {quote.request.request_number}
                </Link>
              </div>
              {job && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Job
                  </p>
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="font-mono text-sm hover:underline text-green-600"
                  >
                    {job.job_number}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Timeline
            entityType="quote"
            entityId={quote.id}
            title="Quote Timeline"
          />

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <QuoteStatusBadge status={quote.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">${quote.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line Items</span>
                <span>{quote.line_items.length}</span>
              </div>
              {quote.sent_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{new Date(quote.sent_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
