"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { JobRepository } from "@/lib/database/repositories";
import { WorkflowService } from "@/lib/database/services";
import {
  queryKeys,
  type JobFilters,
  type JobUpdate,
  type JobStatus,
} from "@/lib/database/types";

/**
 * Hook to fetch a list of jobs with optional filters
 */
export function useJobList(filters?: JobFilters) {
  const supabase = createClient();
  const repo = new JobRepository(supabase);

  return useQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: () => repo.getListItems(filters),
  });
}

/**
 * Hook to fetch a single job by ID with all relations
 */
export function useJob(id: string) {
  const supabase = createClient();
  const repo = new JobRepository(supabase);

  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => repo.findByIdWithRelations(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch a job by quote ID
 */
export function useJobByQuoteId(quoteId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: [...queryKeys.jobs.all, "quote", quoteId],
    queryFn: async () => {
      if (!quoteId) return null;
      const { data } = await supabase
        .from("jobs")
        .select("id, job_number, status")
        .eq("quote_id", quoteId)
        .single();
      return data;
    },
    enabled: !!quoteId,
  });
}

/**
 * Hook to fetch a job by request ID
 */
export function useJobByRequestId(requestId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: [...queryKeys.jobs.all, "request", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data } = await supabase
        .from("jobs")
        .select("id, job_number, status")
        .eq("request_id", requestId)
        .single();
      return data;
    },
    enabled: !!requestId,
  });
}

/**
 * Hook to fetch job status counts
 */
export function useJobStatusCounts(companyId?: string) {
  const supabase = createClient();
  const repo = new JobRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.jobs.all, "counts", companyId],
    queryFn: () => repo.getStatusCounts(companyId),
  });
}

/**
 * Hook to update a job
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new JobRepository(supabase);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobUpdate }) =>
      repo.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
    },
  });
}

/**
 * Hook to update job status (with validation and timeline tracking)
 */
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const workflow = new WorkflowService(supabase);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      workflow.updateJobStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
    },
  });
}

/**
 * Hook to subscribe to real-time job updates
 */
export function useRealtimeJobs(companyId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          ...(companyId ? { filter: `company_id=eq.${companyId}` } : {}),
        },
        () => {
          // Invalidate jobs queries when any job changes
          queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, companyId]);
}

/**
 * Hook to subscribe to real-time updates for a specific job
 */
export function useRealtimeJob(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.jobs.detail(jobId),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.jobs.detail(jobId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.documents.byJob(jobId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, jobId]);
}
