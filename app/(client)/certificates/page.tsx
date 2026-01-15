"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ExternalLink,
  FileText,
  Calendar,
  Loader2,
} from "lucide-react";
import { useDocumentList } from "@/lib/hooks";
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

export default function CertificatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const supabase = createClient();

  const filters = useMemo(
    () => ({
      search: searchQuery || undefined,
      document_type:
        typeFilter !== "all" ? (typeFilter as DocumentType) : undefined,
    }),
    [searchQuery, typeFilter]
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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {certificateTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {documentTypeLabels[type]}
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
      ) : certificatesAndReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">
              No certificates or reports yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Documents will appear here once they are uploaded to your jobs.
            </p>
          </CardContent>
        </Card>
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
