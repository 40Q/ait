"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Send,
  Pencil,
  Copy,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
import type { AdminQuoteStatus, QuoteLineItem } from "../../_types";

// Mock data
const quoteData = {
  id: "Q-2024-0058",
  requestId: "REQ-2024-0045",
  companyId: "1",
  companyName: "Acme Corporation",
  status: "sent" as AdminQuoteStatus,
  createdAt: "December 16, 2024",
  sentAt: "December 16, 2024 at 2:30 PM",
  validUntil: "December 30, 2024",
  pickupDate: "December 20, 2024",
  pickupTimeWindow: "9:00 AM - 12:00 PM",
  lineItems: [
    { id: "1", description: "Equipment Pickup & Transport", quantity: 1, unitPrice: 250, total: 250 },
    { id: "2", description: "Laptop Recycling", quantity: 25, unitPrice: 25, total: 625 },
    { id: "3", description: "Desktop Recycling", quantity: 10, unitPrice: 35, total: 350 },
    { id: "4", description: "Server Recycling", quantity: 3, unitPrice: 75, total: 225 },
    { id: "5", description: "Hard Drive Destruction", quantity: 50, unitPrice: 15, total: 750 },
    { id: "6", description: "HD Serialization", quantity: 50, unitPrice: 5, total: 250 },
    { id: "7", description: "Certificate of Destruction", quantity: 1, unitPrice: 50, total: 50 },
  ] as (QuoteLineItem & { total: number })[],
  subtotal: 2500,
  discount: 50,
  discountType: "amount" as const,
  total: 2450,
  terms: "Payment due within 30 days of service completion. All equipment will be processed in accordance with NIST 800-88 and IEEE 2883-2022 standards. Certificate of Destruction will be provided within 5 business days of processing completion.",
  revisionMessage: null as string | null,
  timeline: [
    { event: "Quote Created", timestamp: "Dec 16, 2024 at 2:00 PM", by: "Admin" },
    { event: "Quote Sent", timestamp: "Dec 16, 2024 at 2:30 PM", by: "Admin" },
  ],
};

function QuoteStatusBadge({ status }: { status: AdminQuoteStatus }) {
  const config: Record<
    AdminQuoteStatus,
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
            <h1 className="text-2xl font-bold">{id}</h1>
            <QuoteStatusBadge status={quoteData.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {quoteData.createdAt}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {quoteData.status === "draft" && (
          <>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send to Client
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/quotes/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Quote
              </Link>
            </Button>
          </>
        )}
        {quoteData.status === "revision_requested" && (
          <Button asChild>
            <Link href={`/admin/quotes/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit & Resend
            </Link>
          </Button>
        )}
      </div>

      {/* Revision Message Alert */}
      {quoteData.status === "revision_requested" && quoteData.revisionMessage && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <MessageSquare className="h-4 w-4" />
              Client Revision Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-900">{quoteData.revisionMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Details */}
          <Card>
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle>Quote Details</CardTitle>
                <Badge variant="outline">
                  Valid until {quoteData.validUntil}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Schedule */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Date</p>
                    <p className="font-medium">{quoteData.pickupDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Window</p>
                    <p className="font-medium">{quoteData.pickupTimeWindow}</p>
                  </div>
                </div>
              </div>

              <Separator />

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
                      {quoteData.lineItems.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ${item.unitPrice.toFixed(2)}
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
                    <span>${quoteData.subtotal.toFixed(2)}</span>
                  </div>
                  {quoteData.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${quoteData.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${quoteData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Terms */}
              <div>
                <h4 className="font-medium mb-2">Terms & Conditions</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {quoteData.terms}
                </p>
              </div>
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
                  href={`/admin/companies/${quoteData.companyId}`}
                  className="font-medium hover:underline"
                >
                  {quoteData.companyName}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Request
                </p>
                <Link
                  href={`/admin/requests/${quoteData.requestId}`}
                  className="font-mono text-sm hover:underline"
                >
                  {quoteData.requestId}
                </Link>
              </div>
              {quoteData.status === "accepted" && (
                <div>
                  <p className="text-sm text-muted-foreground">Job Created</p>
                  <Link
                    href="/admin/jobs/W2512008"
                    className="font-mono text-sm hover:underline"
                  >
                    W2512008
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quoteData.timeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {index < quoteData.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{event.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {event.by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <QuoteStatusBadge status={quoteData.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">${quoteData.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line Items</span>
                <span>{quoteData.lineItems.length}</span>
              </div>
              {quoteData.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{quoteData.sentAt}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
