"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, uploadFiles, deleteFile, type UploadResult, type StorageBucket } from "@/lib/storage/upload";

interface UseFileUploadOptions {
  bucket: StorageBucket;
  folder: string;
}

interface UseFileUploadReturn {
  upload: (file: File) => Promise<UploadResult>;
  uploadMultiple: (files: File[]) => Promise<UploadResult[]>;
  remove: (path: string) => Promise<void>;
  isUploading: boolean;
  error: string | null;
}

/**
 * Hook to handle file uploads to Supabase Storage
 */
export function useFileUpload({ bucket, folder }: UseFileUploadOptions): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const upload = async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadFile(supabase, file, { bucket, folder });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultiple = async (files: File[]): Promise<UploadResult[]> => {
    setIsUploading(true);
    setError(null);
    try {
      const results = await uploadFiles(supabase, files, { bucket, folder });
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const remove = async (path: string): Promise<void> => {
    setError(null);
    try {
      await deleteFile(supabase, bucket, path);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setError(message);
      throw err;
    }
  };

  return {
    upload,
    uploadMultiple,
    remove,
    isUploading,
    error,
  };
}
