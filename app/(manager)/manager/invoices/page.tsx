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
import { Search } from "lucide-react";
import {
  useInvoiceList,
  useCurrentUser,
  useRealtimeInvoices,
  useDownloadInvoicePdf,
  useInvoiceStats,
  usePagination,
} from "@/lib/hooks";
import type { InvoiceListItem, InvoiceStatus, InvoiceFilters } from "@/lib/database/types";
import { toast } from "sonner";

/**
 * Manager Invoices Page
 *
 * Managers can see invoices for their company and all sub-companies.
 * RLS handles the filtering automatically — no company_id filter needed.
 */
export default function ManagerInvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 10,
  });

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const filters: InvoiceFilters | undefined = useMemo(() => {
    const f: InvoiceFilters = {};
    if (statusFilter !== "all") {
      f.status = statusFilter as InvoiceStatus;
    }
    return f;
  }, [statusFilter]);

  const { data: paginatedData, isLoading: invoicesLoading } = useInvoiceList(
    filters,
    currentPage,
    pageSize
  );

  const { data: stats } = useInvoiceStats(currentUser?.company_id ?? undefined);
  const { downloadPdf, downloadingId } = useDownloadInvoicePdf();

  useRealtimeInvoices(undefined);

  const displayedInvoices = useMemo(() => {
    const invoices = paginatedData?.data ?? [];
    if (!searchQuery) return invoices;

    const searchLower = searchQuery.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        (invoice.job_number?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [paginatedData?.data, searchQuery]);

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
        <PageHeader title="Invoices" description="View invoices across all your companies" />
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
        description="View invoices across all your companies"
      />

      <InvoiceStats
        totalAmount={stats?.totalAmount ?? 0}
        paidAmount={stats?.paidAmount ?? 0}
        unpaidAmount={stats?.unpaidAmount ?? 0}
        unpaidCount={stats?.unpaidCount ?? 0}
      />

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
              : "No invoices matching your filters."}
          </p>
        </div>
      )}

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
