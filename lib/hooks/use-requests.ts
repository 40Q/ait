"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { RequestRepository, TimelineRepository } from "@/lib/database/repositories";
import {
  queryKeys,
  type RequestFilters,
  type RequestInsert,
  type RequestUpdate,
} from "@/lib/database/types";
import { getQueryOptions } from "./query-config";

/**
 * Hook to fetch a paginated list of requests with optional filters
 */
export function useRequestList(
  filters?: RequestFilters,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = createClient();
  const repo = new RequestRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.requests.list(filters), page, pageSize],
    queryFn: () => repo.getListItems(filters, page, pageSize),
    placeholderData: keepPreviousData,
    ...getQueryOptions("list"),
  });
}

/**
 * Hook to fetch a single request by ID with all relations
 */
export function useRequest(id: string) {
  const supabase = createClient();
  const repo = new RequestRepository(supabase);

  return useQuery({
    queryKey: queryKeys.requests.detail(id),
    queryFn: () => repo.findByIdWithRelations(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch request status counts (for tabs/badges)
 */
export function useRequestStatusCounts(companyId?: string) {
  const supabase = createClient();
  const repo = new RequestRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.requests.all, "counts", companyId],
    queryFn: () => repo.getStatusCounts(companyId),
  });
}

/**
 * Hook to create a new request
 * Calls server-side API route so admin notifications are sent reliably.
 */
export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    // Timeline event is created automatically by database trigger
    mutationFn: async (data: RequestInsert) => {
      const res = await fetch("/api/workflow/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit request");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all request queries
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
    },
  });
}

/**
 * Hook to update a request
 */
export function useUpdateRequest() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new RequestRepository(supabase);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RequestUpdate }) =>
      repo.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate list and the specific detail
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.detail(id),
      });
    },
  });
}

/**
 * Hook to delete a request
 */
export function useDeleteRequest() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new RequestRepository(supabase);

  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
    },
  });
}

/**
 * Hook to decline a request
 */
export function useDeclineRequest() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const requestRepo = new RequestRepository(supabase);
  const timelineRepo = new TimelineRepository(supabase);

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      // Update request status (triggers auto-create status_change timeline event)
      await requestRepo.update(id, { status: "declined" });

      // Create declined event with reason (separate from status change)
      if (reason) {
        await timelineRepo.createDeclinedEvent("request", id, reason);
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: ["timeline", "request", id],
      });
    },
  });
}
