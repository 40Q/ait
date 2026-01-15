"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DocumentRepository } from "@/lib/database/repositories";
import {
  queryKeys,
  type DocumentFilters,
  type DocumentInsert,
} from "@/lib/database/types";

/**
 * Hook to fetch a list of documents with optional filters
 */
export function useDocumentList(filters?: DocumentFilters) {
  const supabase = createClient();
  const repo = new DocumentRepository(supabase);

  return useQuery({
    queryKey: queryKeys.documents.list(filters),
    queryFn: () => repo.getListItems(filters),
  });
}

/**
 * Hook to fetch documents for a specific job
 */
export function useJobDocuments(jobId: string) {
  const supabase = createClient();
  const repo = new DocumentRepository(supabase);

  return useQuery({
    queryKey: queryKeys.documents.byJob(jobId),
    queryFn: () => repo.findByJobId(jobId),
    enabled: !!jobId,
  });
}

/**
 * Hook to fetch document type counts
 */
export function useDocumentTypeCounts(companyId?: string) {
  const supabase = createClient();
  const repo = new DocumentRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.documents.all, "counts", companyId],
    queryFn: () => repo.getTypeCounts(companyId),
  });
}

/**
 * Hook to create a document (after file upload)
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new DocumentRepository(supabase);

  return useMutation({
    mutationFn: (data: DocumentInsert) => repo.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      // Also invalidate the job to update document counts
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.detail(data.job_id),
      });
    },
  });
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new DocumentRepository(supabase);

  return useMutation({
    mutationFn: async ({
      id,
      jobId,
      filePath,
    }: {
      id: string;
      jobId: string;
      filePath: string;
    }) => {
      // Delete the document record
      await repo.delete(id);

      // Try to delete the file from storage using the full path
      if (filePath) {
        await supabase.storage.from("documents").remove([filePath]);
      }
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.detail(jobId),
      });
    },
  });
}
