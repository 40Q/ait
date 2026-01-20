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
import { ExternalLink, FileText, Calendar } from "lucide-react";
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

  // Pagination
  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
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

  const { data: paginatedData, isLoading, isFetching } = useDocumentList(filters, currentPage, pageSize);

  const documents = paginatedData?.data ?? [];

  // Filter to only show documents (not pickup documents which have their own page)
  const filteredDocuments = documents.filter(
    (doc) => doc.document_type !== "pickup_document"
  );

  // Reset to page 1 when filters change
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="View and download all your documents"
      />

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
