"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { InvoiceStats } from "@/components/invoices";
import {
  Search,
  RefreshCw,
  Download,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import {
  useInvoiceList,
  useInvoiceStatusCounts,
  useSyncInvoices,
  useQuickBooksStatus,
  useLinkInvoiceToJob,
  useRealtimeInvoices,
  useJobList,
  useDownloadInvoicePdf,
  useInvoiceStats,
  usePagination,
} from "@/lib/hooks";
import { formatDateShort, formatRelativeTime } from "@/lib/utils/date";
import type { InvoiceListItem, InvoiceStatus, InvoiceFilters } from "@/lib/database/types";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [linkedFilter, setLinkedFilter] = useState<string>("all");

  // Pagination
  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 20,
  });

  // Build filters for the query
  const filters: InvoiceFilters = useMemo(() => {
    const f: InvoiceFilters = {};
    if (statusFilter !== "all") {
      f.status = statusFilter as InvoiceStatus;
    }
    if (linkedFilter === "linked") {
      f.has_job = true;
    } else if (linkedFilter === "not_linked") {
      f.has_job = false;
    }
    return f;
  }, [statusFilter, linkedFilter]);

  // Fetch paginated data
  const { data: paginatedData, isLoading: invoicesLoading } = useInvoiceList(
    filters,
    currentPage,
    pageSize
  );

  // Fetch stats (server-side calculation)
  const { data: stats } = useInvoiceStats();

  const { data: statusCounts } = useInvoiceStatusCounts();
  const { data: qbStatus } = useQuickBooksStatus();
  const { data: jobs = [] } = useJobList();

  // Mutations and actions
  const syncInvoices = useSyncInvoices();
  const linkInvoice = useLinkInvoiceToJob();
  const { downloadPdf, downloadingId } = useDownloadInvoicePdf();

  // Real-time updates
  useRealtimeInvoices();

  // Client-side search filtering on the current page
  const displayedInvoices = useMemo(() => {
    const invoices = paginatedData?.data ?? [];
    if (!searchQuery) return invoices;

    const searchLower = searchQuery.toLowerCase();
    return invoices.filter((invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      invoice.company_name.toLowerCase().includes(searchLower) ||
      (invoice.job_number?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [paginatedData?.data, searchQuery]);

  // Filter jobs for the selected invoice's company
  const availableJobs = useMemo(() => {
    if (!selectedInvoice) return [];
    return jobs.filter((job) => job.company_id === selectedInvoice.company_id);
  }, [jobs, selectedInvoice]);

  // Reset to first page when filters change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleLinkedFilterChange = (value: string) => {
    setLinkedFilter(value);
    setPage(1);
  };

  const handleSync = async () => {
    try {
      const result = await syncInvoices.mutateAsync();
      toast.success(
        `Synced ${result.result.synced} invoices (${result.result.skipped} skipped)`
      );
      if (result.result.errors.length > 0) {
        console.warn("Sync errors:", result.result.errors);
        toast.warning(`${result.result.errors.length} errors during sync`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync invoices");
    }
  };

  const handleLinkClick = (invoice: InvoiceListItem) => {
    setSelectedInvoice(invoice);
    setSelectedJobId(invoice.job_id || "");
    setLinkDialogOpen(true);
  };

  const handleLinkSubmit = async () => {
    if (!selectedInvoice) return;

    try {
      await linkInvoice.mutateAsync({
        invoiceId: selectedInvoice.id,
        jobId: selectedJobId || null,
      });
      toast.success(
        selectedJobId ? "Invoice linked to job" : "Invoice unlinked from job"
      );
      setLinkDialogOpen(false);
      setSelectedInvoice(null);
      setSelectedJobId("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to link invoice");
    }
  };

  const handleDownloadPdf = async (invoice: InvoiceListItem) => {
    try {
      await downloadPdf(invoice);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download PDF");
    }
  };

  if (invoicesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          description="Manage invoices synced from QuickBooks"
        />
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage invoices synced from QuickBooks"
      >
        <Button onClick={handleSync} disabled={syncInvoices.isPending || !qbStatus?.connected}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${syncInvoices.isPending ? "animate-spin" : ""}`}
          />
          {syncInvoices.isPending ? "Syncing..." : "Sync Invoices"}
        </Button>
      </PageHeader>

      {/* Stats */}
      <InvoiceStats
        totalAmount={stats?.totalAmount ?? 0}
        paidAmount={stats?.paidAmount ?? 0}
        unpaidAmount={stats?.unpaidAmount ?? 0}
        unlinkedCount={stats?.unlinkedCount ?? 0}
        showUnlinked
      />

      {/* Sync Status */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    qbStatus?.connected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm font-medium">
                  {qbStatus?.connected
                    ? "QuickBooks Connected"
                    : "QuickBooks Not Connected"}
                </span>
              </div>
              {qbStatus?.connected && (
                <span className="text-sm text-muted-foreground">
                  Last synced: {formatRelativeTime(qbStatus.lastSync)}
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings">Configure</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search current page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">
              Paid {statusCounts?.paid ? `(${statusCounts.paid})` : ""}
            </SelectItem>
            <SelectItem value="unpaid">
              Unpaid {statusCounts?.unpaid ? `(${statusCounts.unpaid})` : ""}
            </SelectItem>
            <SelectItem value="overdue">
              Overdue {statusCounts?.overdue ? `(${statusCounts.overdue})` : ""}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={linkedFilter} onValueChange={handleLinkedFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Linked Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="linked">Linked to Job</SelectItem>
            <SelectItem value="not_linked">Not Linked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Linked Job</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <span className="font-mono font-medium">
                    {invoice.invoice_number}
                  </span>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/companies/${invoice.company_id}`}
                    className="hover:underline"
                  >
                    {invoice.company_name}
                  </Link>
                </TableCell>
                <TableCell>
                  {invoice.job_id ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/jobs/${invoice.job_id}`}
                        className="font-mono text-sm hover:underline"
                      >
                        {invoice.job_number}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleLinkClick(invoice)}
                        title="Change linked job"
                      >
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2"
                      onClick={() => handleLinkClick(invoice)}
                    >
                      <LinkIcon className="mr-1 h-3 w-3" />
                      Link to Job
                    </Button>
                  )}
                </TableCell>
                <TableCell>{formatDateShort(invoice.invoice_date)}</TableCell>
                <TableCell>
                  <span
                    className={
                      invoice.status === "overdue" ? "text-red-500" : ""
                    }
                  >
                    {formatDateShort(invoice.due_date)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${invoice.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status as InvoiceStatus} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Download PDF"
                    onClick={() => handleDownloadPdf(invoice)}
                    disabled={!invoice.quickbooks_id || downloadingId === invoice.id}
                  >
                    {downloadingId === invoice.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {displayedInvoices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {(paginatedData?.total ?? 0) === 0
              ? "No invoices synced yet. Click 'Sync Invoices' to import from QuickBooks."
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

      {/* Link Invoice Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Invoice to Job</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Link invoice{" "}
                  <span className="font-mono font-medium">
                    {selectedInvoice.invoice_number}
                  </span>{" "}
                  to a job from {selectedInvoice.company_name}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={selectedJobId || "none"}
              onValueChange={(v) => setSelectedJobId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No job (unlink)</SelectItem>
                {availableJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_number} - {job.location_summary}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableJobs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No jobs found for this company.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkSubmit} disabled={linkInvoice.isPending}>
              {linkInvoice.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedJobId ? "Link Invoice" : "Unlink Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
