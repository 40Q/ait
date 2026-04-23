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
import { useDocumentList, usePagination } from "@/lib/hooks";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/storage/upload";
import { formatDateShort } from "@/lib/utils/date";
import {
  documentTypeLabels,
  type DocumentType,
  type DocumentListItem,
} from "@/lib/database/types";

// Document types (excluding pickup_document which is shown in Pickup Details, and COI which has its own tab)
const documentTypes = (
  Object.keys(documentTypeLabels) as DocumentType[]
).filter((type) => type !== "pickup_document" && type !== "certificate_of_insurance");

const typeFilterOptions = [
  { value: "all", label: "All Types" },
  ...documentTypes.map((type) => ({ value: type, label: documentTypeLabels[type] })),
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [coiSearchQuery, setCoiSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const debouncedCoiSearch = useDebouncedValue(coiSearchQuery, 300);
  const supabase = createClient();

  // Pagination for main docs
  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 20,
  });

  // Pagination for COI tab
  const { currentPage: coiPage, pageSize: coiPageSize, setPage: setCoiPage, setPageSize: setCoiPageSize } = usePagination({
    initialPageSize: 20,
  });

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      document_type:
        typeFilter !== "all" ? (typeFilter as DocumentType) : undefined,
    }),
    [debouncedSearch, typeFilter]
  );

  const coiFilters = useMemo(
    () => ({
      search: debouncedCoiSearch || undefined,
      document_type: "certificate_of_insurance" as DocumentType,
    }),
    [debouncedCoiSearch]
  );

  const { data: paginatedData, isLoading, isFetching } = useDocumentList(filters, currentPage, pageSize);
  const { data: coiPaginatedData, isLoading: coiLoading, isFetching: coiFetching } = useDocumentList(coiFilters, coiPage, coiPageSize);

  const documents = paginatedData?.data ?? [];
  const coiDocuments = coiPaginatedData?.data ?? [];

  // Filter main tab to exclude COI and pickup documents
  const filteredDocuments = documents.filter(
    (doc) => doc.document_type !== "pickup_document" && doc.document_type !== "certificate_of_insurance"
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, [setPage]);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setPage(1);
  }, [setPage]);

  const handleCoiSearchChange = useCallback((value: string) => {
    setCoiSearchQuery(value);
    setCoiPage(1);
  }, [setCoiPage]);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="View and download all your documents"
      />

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="coi">
            Certificate of Insurance
            {coiPaginatedData && coiPaginatedData.total > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {coiPaginatedData.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <ListFilters
            searchValue={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by name or job..."
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

        {/* COI Tab */}
        <TabsContent value="coi" className="mt-4 space-y-4">
          <ListFilters
            searchValue={coiSearchQuery}
            onSearchChange={handleCoiSearchChange}
            searchPlaceholder="Search by name, job, or location..."
            isLoading={coiFetching}
          />

          {coiLoading ? (
            <LoadingSpinner />
          ) : (
            <FetchingIndicator isFetching={coiFetching}>
              {coiDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No COI documents yet"
                  description="Certificate of Insurance documents will appear here once they are uploaded."
                />
              ) : (
                <div className="space-y-3">
                  {coiDocuments.map((doc) => (
                    <CoiDocumentCard key={doc.id} document={doc} onView={handleView} />
                  ))}
                </div>
              )}
            </FetchingIndicator>
          )}

          {coiPaginatedData && coiPaginatedData.totalPages > 0 && (
            <Pagination
              currentPage={coiPage}
              totalPages={coiPaginatedData.totalPages}
              totalItems={coiPaginatedData.total}
              pageSize={coiPageSize}
              onPageChange={setCoiPage}
              onPageSizeChange={setCoiPageSize}
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
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href={`/jobs/${document.job_id}`}
                  className="hover:text-primary hover:underline"
                >
                  {document.job_number}
                </Link>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
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

function CoiDocumentCard({
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
