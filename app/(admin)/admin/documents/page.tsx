"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Upload, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FetchingIndicator } from "@/components/ui/fetching-indicator";
import {
  useDocumentList,
  useDeleteDocument,
  usePagination,
  useInvoiceList,
  useDownloadInvoicePdf,
} from "@/lib/hooks";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { type DocumentType, type InvoiceListItem } from "@/lib/database/types";
import { DocumentList } from "@/components/ui/document-list";
import { InvoiceCard } from "@/components/invoices";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/storage/upload";
import { toast } from "sonner";

const documentTypes: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "certificate_of_destruction", label: "Certificate of Destruction" },
  { value: "certificate_of_recycling", label: "Certificate of Recycling" },
  { value: "hd_serialization", label: "HD Serialization Report" },
  { value: "asset_serialization", label: "Asset Serialization Report" },
  { value: "warehouse_report", label: "Warehouse Processing Report" },
  { value: "pickup_document", label: "Pickup Document" },
  { value: "certificate_of_insurance", label: "Certificate of Insurance (COI)" },
  { value: "workers_compensation", label: "Workers Compensation (WC)" },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const supabase = createClient();

  // Pagination
  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 20,
  });

  // Pagination for invoices tab
  const {
    currentPage: invoicePage,
    pageSize: invoicePageSize,
    setPage: setInvoicePage,
    setPageSize: setInvoicePageSize,
  } = usePagination({ initialPageSize: 20 });

  // Fetch documents with filters
  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    document_type: typeFilter !== "all" ? (typeFilter as DocumentType) : undefined,
  }), [debouncedSearch, typeFilter]);

  const { data: paginatedData, isLoading, isFetching, error } = useDocumentList(filters, currentPage, pageSize);
  const { data: invoicePaginatedData, isLoading: invoiceLoading, isFetching: invoiceFetching } = useInvoiceList(undefined, invoicePage, invoicePageSize);
  const deleteDocument = useDeleteDocument();
  const { downloadPdf, downloadingId } = useDownloadInvoicePdf();

  const documents = paginatedData?.data ?? [];
  const invoices = invoicePaginatedData?.data ?? [];

  // Reset to page 1 when filters change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  }, [setPage]);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setPage(1);
  }, [setPage]);

  const handleView = async (filePath: string) => {
    try {
      const signedUrl = await getSignedUrl(supabase, STORAGE_BUCKETS.DOCUMENTS, filePath);
      window.open(signedUrl, "_blank");
    } catch (error) {
      console.error("Failed to view document:", error);
    }
  };

  const handleDelete = (id: string, filePath: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocument.mutate({ id, jobId: doc.job_id, filePath });
    }
  };

  const handleDownloadInvoice = async (invoice: InvoiceListItem) => {
    try {
      await downloadPdf(invoice);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download invoice");
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load documents: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="View and manage all uploaded documents"
      >
        <Button asChild>
          <Link href="/admin/jobs">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices
            {invoicePaginatedData && invoicePaginatedData.total > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {invoicePaginatedData.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1 max-w-sm">
              {isFetching ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                placeholder="Search by name, job ID, or company..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <FetchingIndicator isFetching={isFetching}>
              <DocumentList
                documents={documents}
                onView={handleView}
                onDelete={handleDelete}
                isDeleting={deleteDocument.isPending}
                showJob
                showCompany
                showSize
                showUploader
                emptyMessage="No documents found"
              />
            </FetchingIndicator>
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
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-4">
          {invoiceLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <FetchingIndicator isFetching={invoiceFetching}>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No invoices found</div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onDownloadPdf={handleDownloadInvoice}
                      isDownloading={downloadingId === invoice.id}
                      linkPrefix="/admin/jobs"
                      showCompany
                      companyLinkPrefix="/admin/companies"
                    />
                  ))}
                </div>
              )}
            </FetchingIndicator>
          )}

          {invoicePaginatedData && invoicePaginatedData.totalPages > 0 && (
            <Pagination
              currentPage={invoicePage}
              totalPages={invoicePaginatedData.totalPages}
              totalItems={invoicePaginatedData.total}
              pageSize={invoicePageSize}
              onPageChange={setInvoicePage}
              onPageSizeChange={setInvoicePageSize}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
