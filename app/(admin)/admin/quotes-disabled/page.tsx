"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import {
  Search,
  Eye,
  FileText,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { AdminQuoteStatus } from "../_types";

interface QuoteListItem {
  id: string;
  requestId: string;
  companyId: string;
  companyName: string;
  status: AdminQuoteStatus;
  createdAt: string;
  sentAt?: string;
  validUntil: string;
  pickupDate: string;
  total: number;
  hasRevisionRequest: boolean;
}

// Mock data
const quotes: QuoteListItem[] = [
  {
    id: "Q-2024-0058",
    requestId: "REQ-2024-0045",
    companyId: "1",
    companyName: "Acme Corporation",
    status: "sent",
    createdAt: "Dec 16, 2024",
    sentAt: "Dec 16, 2024",
    validUntil: "Dec 30, 2024",
    pickupDate: "Dec 20, 2024",
    total: 2450,
    hasRevisionRequest: false,
  },
  {
    id: "Q-2024-0057",
    requestId: "REQ-2024-0044",
    companyId: "2",
    companyName: "TechStart Inc",
    status: "accepted",
    createdAt: "Dec 14, 2024",
    sentAt: "Dec 14, 2024",
    validUntil: "Dec 28, 2024",
    pickupDate: "Dec 18, 2024",
    total: 1850,
    hasRevisionRequest: false,
  },
  {
    id: "Q-2024-0056",
    requestId: "REQ-2024-0043",
    companyId: "3",
    companyName: "Global Systems",
    status: "revision_requested",
    createdAt: "Dec 12, 2024",
    sentAt: "Dec 12, 2024",
    validUntil: "Dec 26, 2024",
    pickupDate: "Dec 16, 2024",
    total: 3200,
    hasRevisionRequest: true,
  },
  {
    id: "Q-2024-0055",
    requestId: "REQ-2024-0042",
    companyId: "4",
    companyName: "DataFlow LLC",
    status: "draft",
    createdAt: "Dec 10, 2024",
    validUntil: "Dec 24, 2024",
    pickupDate: "Dec 15, 2024",
    total: 980,
    hasRevisionRequest: false,
  },
  {
    id: "Q-2024-0054",
    requestId: "REQ-2024-0041",
    companyId: "5",
    companyName: "SmallBiz Co",
    status: "declined",
    createdAt: "Dec 8, 2024",
    sentAt: "Dec 8, 2024",
    validUntil: "Dec 22, 2024",
    pickupDate: "Dec 12, 2024",
    total: 450,
    hasRevisionRequest: false,
  },
];

function QuoteStatusBadge({ status }: { status: AdminQuoteStatus }) {
  const config: Record<
    AdminQuoteStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    draft: { label: "Draft", variant: "secondary" },
    sent: { label: "Sent", variant: "default" },
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
          ? "border-orange-300 text-orange-700"
          : ""
      }
    >
      {label}
    </Badge>
  );
}

export default function QuotesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const statusCounts = {
    all: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    declined: quotes.filter((q) => q.status === "declined").length,
    revision_requested: quotes.filter((q) => q.status === "revision_requested").length,
  };

  const filterQuotes = (status: string) => {
    let filtered = quotes;

    if (status !== "all") {
      filtered = filtered.filter((q) => q.status === status);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.id.toLowerCase().includes(query) ||
          q.companyName.toLowerCase().includes(query) ||
          q.requestId.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Calculate stats
  const totalQuotesThisMonth = quotes.length;
  const acceptedCount = quotes.filter((q) => q.status === "accepted").length;
  const acceptanceRate = Math.round((acceptedCount / totalQuotesThisMonth) * 100);
  const avgQuoteValue = Math.round(
    quotes.reduce((sum, q) => sum + q.total, 0) / quotes.length
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Create and manage quotes for pickup requests"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Quotes This Month"
          value={totalQuotesThisMonth}
          icon={FileText}
        />
        <StatCard
          title="Acceptance Rate"
          value={`${acceptanceRate}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Average Quote Value"
          value={`$${avgQuoteValue.toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by quote #, request #, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({statusCounts.sent})</TabsTrigger>
          <TabsTrigger value="revision_requested">
            Revisions ({statusCounts.revision_requested})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({statusCounts.accepted})
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined ({statusCounts.declined})
          </TabsTrigger>
        </TabsList>

        {[
          "all",
          "draft",
          "sent",
          "revision_requested",
          "accepted",
          "declined",
        ].map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterQuotes(status).map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Link
                          href={`/admin/quotes/${quote.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {quote.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/companies/${quote.companyId}`}
                          className="hover:underline"
                        >
                          {quote.companyName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/requests/${quote.requestId}`}
                          className="font-mono text-sm text-muted-foreground hover:underline"
                        >
                          {quote.requestId}
                        </Link>
                      </TableCell>
                      <TableCell>{quote.pickupDate}</TableCell>
                      <TableCell>
                        <span
                          className={
                            new Date(quote.validUntil) < new Date()
                              ? "text-red-500"
                              : ""
                          }
                        >
                          {quote.validUntil}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${quote.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <QuoteStatusBadge status={quote.status} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/quotes/${quote.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filterQuotes(status).length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No quotes found</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
