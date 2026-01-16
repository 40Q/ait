"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ListFilters } from "@/components/ui/list-filters";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ExternalLink, FileText, Calendar } from "lucide-react";
import { useDocumentList, useListPage } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/storage/upload";
import { formatDateShort } from "@/lib/utils/date";
import {
  documentTypeLabels,
  type DocumentType,
  type DocumentListItem,
} from "@/lib/database/types";

// Certificate/report types (excluding pickup_document)
const certificateTypes = (
  Object.keys(documentTypeLabels) as DocumentType[]
).filter((type) => type !== "pickup_document");

const typeFilterOptions = [
  { value: "all", label: "All Types" },
  ...certificateTypes.map((type) => ({ value: type, label: documentTypeLabels[type] })),
];

export default function CertificatesPage() {
  const { searchQuery, setSearchQuery, filters: pageFilters, setFilter } = useListPage<{
    type: string;
  }>({
    defaultFilters: { type: "all" },
  });
  const supabase = createClient();

  const filters = useMemo(
    () => ({
      search: searchQuery || undefined,
      document_type:
        pageFilters.type !== "all" ? (pageFilters.type as DocumentType) : undefined,
    }),
    [searchQuery, pageFilters.type]
  );

  const { data: documents = [], isLoading } = useDocumentList(filters);

  // Filter to only show certificates and reports (not pickup documents)
  const certificatesAndReports = documents.filter(
    (doc) => doc.document_type !== "pickup_document"
  );

  const handleView = async (filePath: string) => {
    try {
      const signedUrl = await getSignedUrl(
        supabase,
        STORAGE_BUCKETS.DOCUMENTS,
        filePath,
        60
      );
      window.open(signedUrl, "_blank");
    } catch (error) {
      console.error("Failed to view document:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates & Reports"
        description="View and download all your certificates and reports"
      />

      <ListFilters
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or job..."
        filters={[
          {
            value: pageFilters.type,
            onChange: (value) => setFilter("type", value),
            options: typeFilterOptions,
            className: "w-full sm:w-56",
          },
        ]}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : certificatesAndReports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No certificates or reports yet"
          description="Documents will appear here once they are uploaded to your jobs."
        />
      ) : (
        <div className="space-y-3">
          {certificatesAndReports.map((doc) => (
            <DocumentCard key={doc.id} document={doc} onView={handleView} />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && certificatesAndReports.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {certificatesAndReports.length} document
          {certificatesAndReports.length !== 1 ? "s" : ""}
        </p>
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
            onClick={() => onView(document.file_url)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
