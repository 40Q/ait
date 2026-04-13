"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { InvoiceCard, InvoiceStats } from "@/components/invoices";
import { Search, Receipt, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useInvoiceList,
  useCurrentUser,
  useRealtimeInvoices,
  useDownloadInvoicePdf,
  useInvoiceStats,
  usePagination,
} from "@/lib/hooks";
import { useMutation } from "@tanstack/react-query";
import type { InvoiceListItem, InvoiceStatus, InvoiceFilters } from "@/lib/database/types";
import { toast } from "sonner";

function useRequestInvoiceAccess() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/client/request-invoice-access", {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send request");
      }
      return result;
    },
  });
}

function ParentInvoiceAccessBanner({ parentCompanyName }: { parentCompanyName: string | null }) {
  const requestAccess = useRequestInvoiceAccess();

  const handleRequest = () => {
    requestAccess.mutate(undefined, {
      onSuccess: () => toast.success("Request sent to your manager"),
      onError: (err) => toast.error(err.message),
    });
  };

  const label = parentCompanyName ?? "Organization";

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-2 mt-0.5 shrink-0">
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">{label} invoices</p>
          </div>
        </div>
        {requestAccess.isSuccess ? (
          <p className="flex items-center gap-2 text-sm text-green-600 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
            Request sent
          </p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequest}
            disabled={requestAccess.isPending}
            className="shrink-0"
          >
            {requestAccess.isPending ? (
              "Sending..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Request Invoice Access
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 10,
  });

  // Get current user's company
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const companyId = currentUser?.company_id;
  const isSubCompanyUser = currentUser?.is_sub_company_user ?? false;
  const hasParentInvoiceAccess = isSubCompanyUser && (currentUser?.invoice_access ?? false);

  // Build filters — sub-company users with parent access omit company_id so RLS
  // returns both their own and parent company invoices
  const filters: InvoiceFilters | undefined = useMemo(() => {
    if (!companyId) return undefined;
    const f: InvoiceFilters = {};
    if (!hasParentInvoiceAccess) {
      f.company_id = companyId;
    }
    if (statusFilter !== "all") {
      f.status = statusFilter as InvoiceStatus;
    }
    return f;
  }, [companyId, statusFilter, hasParentInvoiceAccess]);

  // Fetch paginated invoices
  const { data: paginatedData, isLoading: invoicesLoading } = useInvoiceList(
    filters,
    currentPage,
    pageSize
  );

  // Fetch stats — omit companyId when user can see parent invoices so totals include both
  const statsCompanyId = hasParentInvoiceAccess ? undefined : (companyId ?? undefined);
  const { data: stats } = useInvoiceStats(statsCompanyId);

  // PDF download
  const { downloadPdf, downloadingId } = useDownloadInvoicePdf();

  // Real-time updates
  useRealtimeInvoices(companyId ?? undefined);

  // Client-side search filtering on current page
  const displayedInvoices = useMemo(() => {
    const invoices = paginatedData?.data ?? [];
    if (!searchQuery) return invoices;

    const searchLower = searchQuery.toLowerCase();
    return invoices.filter((invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      (invoice.job_number?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [paginatedData?.data, searchQuery]);

  // Reset to first page when status filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDownloadPdf = async (invoice: InvoiceListItem) => {
    try {
      await downloadPdf(invoice);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download PDF");
    }
  };

  const isLoading = userLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          description="View and manage all your invoices"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-12" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="View and manage all your invoices"
      />

      {/* Prompt sub-company users to request access to parent company invoices */ }
      {!userLoading && isSubCompanyUser && !currentUser?.invoice_access && (
        <ParentInvoiceAccessBanner parentCompanyName={currentUser?.parent_company_name ?? null} />
      )}

      {/* Summary Stats */}
      <InvoiceStats
        totalAmount={stats?.totalAmount ?? 0}
        paidAmount={stats?.paidAmount ?? 0}
        unpaidAmount={stats?.unpaidAmount ?? 0}
        unpaidCount={stats?.unpaidCount ?? 0}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search current page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      {displayedInvoices.length > 0 ? (
        <div className="space-y-3">
          {displayedInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onDownloadPdf={handleDownloadPdf}
              isDownloading={downloadingId === invoice.id}
              linkPrefix="/jobs"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {(paginatedData?.total ?? 0) === 0
              ? "No invoices found."
              : "No invoices found matching your filters."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {paginatedData && paginatedData.totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginatedData.totalPages}
          totalItems={paginatedData.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
