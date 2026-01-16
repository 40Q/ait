"use client";

import Link from "next/link";
import { FileText, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { documentTypeLabels, type DocumentType } from "@/lib/database/types";
import { formatFileSize } from "@/lib/storage/upload";
import { formatDateShort } from "@/lib/utils/date";

export interface DocumentListItem {
  id: string;
  name: string;
  document_type: DocumentType;
  file_path: string;
  created_at: string;
  file_size?: number | null;
  // Optional fields for showing related info
  job_id?: string;
  job_number?: string;
  company_id?: string;
  company_name?: string;
  uploaded_by_name?: string;
}

interface DocumentListProps {
  documents: DocumentListItem[];
  onView: (filePath: string) => void;
  onDelete?: (id: string, filePath: string) => void;
  isDeleting?: boolean;
  showJob?: boolean;
  showCompany?: boolean;
  showSize?: boolean;
  showUploader?: boolean;
  emptyMessage?: string;
}

export function DocumentList({
  documents,
  onView,
  onDelete,
  isDeleting = false,
  showJob = false,
  showCompany = false,
  showSize = false,
  showUploader = false,
  emptyMessage = "No documents uploaded yet",
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileText className="h-8 w-8 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{doc.name}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {documentTypeLabels[doc.document_type]}
                </Badge>
                <span>{formatDateShort(doc.created_at)}</span>
                {showJob && doc.job_number && (
                  <Link
                    href={`/admin/jobs/${doc.job_id}`}
                    className="font-mono hover:underline"
                  >
                    {doc.job_number}
                  </Link>
                )}
                {showCompany && doc.company_name && (
                  <Link
                    href={`/admin/companies/${doc.company_id}`}
                    className="hover:underline"
                  >
                    {doc.company_name}
                  </Link>
                )}
                {showSize && doc.file_size && (
                  <span>{formatFileSize(doc.file_size)}</span>
                )}
                {showUploader && doc.uploaded_by_name && (
                  <span>by {doc.uploaded_by_name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(doc.file_path)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(doc.id, doc.file_path)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface DocumentListLoadingProps {
  count?: number;
}

export function DocumentListLoading({ count = 3 }: DocumentListLoadingProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-muted animate-pulse" />
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="flex gap-1">
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
