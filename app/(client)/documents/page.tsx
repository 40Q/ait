"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ListFilters } from "@/components/ui/list-filters";
import { FetchingIndicator } from "@/components/ui/fetching-indicator";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, FileText, Calendar, MapPin } from "lucide-react";
import {
  useDocumentList,
  usePagination,
  useInvoiceList,
  useDownloadInvoicePdf,
} from "@/lib/hooks";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/storage/upload";
import { formatDateShort } from "@/lib/utils/date";
import { InvoiceCard } from "@/components/invoices";
import {
  documentTypeLabels,
  type DocumentType,
  type DocumentListItem,
  type InvoiceListItem,
} from "@/lib/database/types";
import { toast } from "sonner";

// Document types (excluding pickup_document which is shown in Pickup Details)
const documentTypes = (
  Object.keys(documentTypeLabels) as DocumentType[]
).filter((type) => type !== "pickup_document");

const typeFilterOptions = [
  { value: "all", label: "All Types" },
  ...documentTypes.map((type) => ({ value: type, label: documentTypeLabels[type] })),
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const supabase = createClient();

  // Pagination for main docs
  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 20,
  });

  // Pagination for Invoices tab
  const {
    currentPage: invoicePage,
    pageSize: invoicePageSize,
    setPage: setInvoicePage,
    setPageSize: setInvoicePageSize,
  } = usePagination({ initialPageSize: 20 });

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      document_type:
        typeFilter !== "all" ? (typeFilter as DocumentType) : undefined,
    }),
    [debouncedSearch, typeFilter]
  );

  const { data: paginatedData, isLoading, isFetching } = useDocumentList(filters, currentPage, pageSize);
  const { data: invoicePaginatedData, isLoading: invoiceLoading, isFetching: invoiceFetching } = useInvoiceList(undefined, invoicePage, invoicePageSize);
  const { downloadPdf, downloadingId } = useDownloadInvoicePdf();

  const documents = paginatedData?.data ?? [];
  const invoices = invoicePaginatedData?.data ?? [];

  // Pickup documents have their own page
  const filteredDocuments = documents.filter(
    (doc) => doc.document_type !== "pickup_document"
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, [setPage]);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setPage(1);
  }, [setPage]);

  const handleView = async (filePath: string) => {
    try {
      const signedUrl = await getSignedUrl(
        supabase,
        STORAGE_BUCKETS.DOCUMENTS,
        filePath
      );
      window.open(signedUrl, "_blank");
    } catch (error) {
      console.error("Failed to view document:", error);
    }
  };

  const handleDownloadInvoice = async (invoice: InvoiceListItem) => {
    try {
      await downloadPdf(invoice);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download invoice");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="View and download all your documents"
      />

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

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <ListFilters
            searchValue={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by name, job, or location..."
            isLoading={isFetching}
            filters={[
              {
                value: typeFilter,
                onChange: handleTypeFilterChange,
                options: typeFilterOptions,
                className: "w-full sm:w-56",
              },
            ]}
          />

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <FetchingIndicator isFetching={isFetching}>
              {filteredDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Documents will appear here once they are uploaded to your jobs."
                />
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} onView={handleView} />
                  ))}
                </div>
              )}
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

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4 space-y-4">
          {invoiceLoading ? (
            <LoadingSpinner />
          ) : (
            <FetchingIndicator isFetching={invoiceFetching}>
              {invoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No invoices yet"
                  description="Invoices will appear here once they are uploaded to your jobs."
                />
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onDownloadPdf={handleDownloadInvoice}
                      isDownloading={downloadingId === invoice.id}
                      linkPrefix="/jobs"
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

function DocumentCard({
  document,
  onView,
}: {
  document: DocumentListItem;
  onView: (filePath: string) => void;
}) {
  const location = document.location;
  const locationText = location
    ? `${location.address}, ${location.city}, ${location.state} ${location.zip_code}`
    : null;

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{document.name}</p>
              {locationText && (
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span>{locationText}</span>
                </div>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <Link
                  href={`/jobs/${document.job_id}`}
                  className="hover:text-primary hover:underline"
                >
                  {document.job_number}
                </Link>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateShort(document.created_at)}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(document.file_path)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
