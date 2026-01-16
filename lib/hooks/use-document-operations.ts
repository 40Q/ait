"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, type StorageBucket } from "@/lib/storage/upload";

interface UseDocumentOperationsOptions {
  bucket: StorageBucket;
  onDeleteSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseDocumentOperationsReturn {
  viewDocument: (filePath: string) => Promise<void>;
  downloadDocument: (filePath: string, fileName?: string) => Promise<void>;
  deleteDocument: (filePath: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for common document operations (view, download, delete)
 */
export function useDocumentOperations({
  bucket,
  onDeleteSuccess,
  onError,
}: UseDocumentOperationsOptions): UseDocumentOperationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const viewDocument = async (filePath: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const signedUrl = await getSignedUrl(supabase, bucket, filePath, 60);
      window.open(signedUrl, "_blank");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to view document";
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDocument = async (filePath: string, fileName?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const signedUrl = await getSignedUrl(supabase, bucket, filePath, 60);

      const link = document.createElement("a");
      link.href = signedUrl;
      link.download = fileName || filePath.split("/").pop() || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download document";
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (filePath: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (deleteError) throw deleteError;

      onDeleteSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete document";
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    viewDocument,
    downloadDocument,
    deleteDocument,
    isLoading,
    error,
  };
}
