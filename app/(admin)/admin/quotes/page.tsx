"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
import { ListFilters } from "@/components/ui/list-filters";
import { Loader2, Eye, FileText, DollarSign, TrendingUp } from "lucide-react";
import { useQuoteList, useQuoteStatusCounts, useListPage, useTabFilter } from "@/lib/hooks";
import { formatDate } from "@/lib/utils/date";
import type { QuoteStatus } from "@/lib/database/types";

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const config: Record<
    QuoteStatus,
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
  const { searchQuery, setSearchQuery } = useListPage();
  const { activeTab, setActiveTab } = useTabFilter("all");

  // Fetch quotes with filters (status only, search is client-side)
  const filters = useMemo(() => ({
    status: activeTab !== "all" ? (activeTab as QuoteStatus) : undefined,
  }), [activeTab]);

  const { data: allQuotes = [], isLoading, error } = useQuoteList(filters);
  const { data: statusCounts } = useQuoteStatusCounts();

  // Client-side search across quote_number, request_number, and company_name
  const quotes = useMemo(() => {
    if (!searchQuery.trim()) return allQuotes;
    const query = searchQuery.toLowerCase();
    return allQuotes.filter(
      (quote) =>
        quote.quote_number.toLowerCase().includes(query) ||
        quote.request_number.toLowerCase().includes(query) ||
        quote.company_name.toLowerCase().includes(query)
    );
  }, [allQuotes, searchQuery]);

  // Calculate stats from current quotes
  const totalQuotes = statusCounts?.all ?? 0;
  const acceptedCount = statusCounts?.accepted ?? 0;
  const acceptanceRate = totalQuotes > 0 ? Math.round((acceptedCount / totalQuotes) * 100) : 0;
  const avgQuoteValue = quotes.length > 0
    ? Math.round(quotes.reduce((sum, q) => sum + q.total, 0) / quotes.length)
    : 0;

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load quotes: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Create and manage quotes for pickup requests"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Quotes"
          value={totalQuotes}
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

      <ListFilters
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by quote #, request #, or company..."
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts?.all ?? 0})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({statusCounts?.draft ?? 0})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({statusCounts?.sent ?? 0})</TabsTrigger>
          <TabsTrigger value="revision_requested">
            Revisions ({statusCounts?.revision_requested ?? 0})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({statusCounts?.accepted ?? 0})
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined ({statusCounts?.declined ?? 0})
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
            <div className="rounded-md border overflow-x-auto">
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : quotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <p className="text-muted-foreground">No quotes found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          <Link
                            href={`/admin/quotes/${quote.id}`}
                            className="font-mono text-sm font-medium hover:underline"
                          >
                            {quote.quote_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/companies/${quote.company_id}`}
                            className="hover:underline"
                          >
                            {quote.company_name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/requests/${quote.request_id}`}
                            className="font-mono text-sm text-muted-foreground hover:underline"
                          >
                            {quote.request_number}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(quote.pickup_date) || "Not specified"}</TableCell>
                        <TableCell>
                          <span
                            className={
                              new Date(quote.valid_until) < new Date()
                                ? "text-red-500"
                                : ""
                            }
                          >
                            {formatDate(quote.valid_until)}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
