"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { RequestRepository, TimelineRepository } from "@/lib/database/repositories";
import {
  queryKeys,
  type RequestFilters,
  type RequestInsert,
  type RequestUpdate,
  type RequestListItem,
  type RequestWithRelations,
  type PaginationParams,
} from "@/lib/database/types";

/**
 * Hook to fetch a list of requests with optional filters
 */
export function useRequestList(filters?: RequestFilters) {
  const supabase = createClient();
  const repo = new RequestRepository(supabase);

  return useQuery({
    queryKey: queryKeys.requests.list(filters),
    queryFn: () => repo.getListItems(filters),
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
 */
export function useCreateRequest() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new RequestRepository(supabase);

  return useMutation({
    // Timeline event is created automatically by database trigger
    mutationFn: (data: RequestInsert) => repo.create(data),
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
