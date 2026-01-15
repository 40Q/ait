"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Upload, Loader2 } from "lucide-react";
import { useDocumentList, useDeleteDocument } from "@/lib/hooks";
import { type DocumentType } from "@/lib/database/types";
import { DocumentList } from "@/components/ui/document-list";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/storage/upload";

const documentTypes: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "certificate_of_destruction", label: "Certificate of Destruction" },
  { value: "certificate_of_recycling", label: "Certificate of Recycling" },
  { value: "hd_serialization", label: "HD Serialization Report" },
  { value: "asset_serialization", label: "Asset Serialization Report" },
  { value: "warehouse_report", label: "Warehouse Processing Report" },
  { value: "pickup_document", label: "Pickup Document" },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const supabase = createClient();

  // Fetch documents with filters
  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    document_type: typeFilter !== "all" ? (typeFilter as DocumentType) : undefined,
  }), [searchQuery, typeFilter]);

  const { data: documents = [], isLoading, error } = useDocumentList(filters);
  const deleteDocument = useDeleteDocument();

  const handleView = async (filePath: string) => {
    try {
      const signedUrl = await getSignedUrl(supabase, STORAGE_BUCKETS.DOCUMENTS, filePath, 60);
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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, job ID, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
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
      )}

      {/* Results Count */}
      {!isLoading && documents.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {documents.length} documents
        </p>
      )}
    </div>
  );
}
