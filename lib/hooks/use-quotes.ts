"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QuoteRepository } from "@/lib/database/repositories";
import { WorkflowService } from "@/lib/database/services";
import {
  queryKeys,
  type QuoteFilters,
  type QuoteInsert,
  type QuoteUpdate,
  type QuoteResponse,
  type QuoteLineItemInsert,
} from "@/lib/database/types";

/**
 * Hook to fetch a list of quotes with optional filters
 */
export function useQuoteList(filters?: QuoteFilters) {
  const supabase = createClient();
  const repo = new QuoteRepository(supabase);

  return useQuery({
    queryKey: queryKeys.quotes.list(filters),
    queryFn: () => repo.getListItems(filters),
  });
}

/**
 * Hook to fetch a single quote by ID with all relations
 */
export function useQuote(id: string) {
  const supabase = createClient();
  const repo = new QuoteRepository(supabase);

  return useQuery({
    queryKey: queryKeys.quotes.detail(id),
    queryFn: () => repo.findByIdWithRelations(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch quote for a specific request
 */
export function useQuoteByRequestId(requestId: string) {
  const supabase = createClient();
  const repo = new QuoteRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.quotes.all, "request", requestId],
    queryFn: () => repo.findByRequestId(requestId),
    enabled: !!requestId,
  });
}

/**
 * Hook to fetch quote status counts
 */
export function useQuoteStatusCounts(companyId?: string) {
  const supabase = createClient();
  const repo = new QuoteRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.quotes.all, "counts", companyId],
    queryFn: () => repo.getStatusCounts(companyId),
  });
}

/**
 * Hook to create a new quote with line items
 */
export function useCreateQuote() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new QuoteRepository(supabase);

  return useMutation({
    mutationFn: ({
      quote,
      lineItems,
    }: {
      quote: QuoteInsert;
      lineItems: Omit<QuoteLineItemInsert, "quote_id">[];
    }) => repo.createWithLineItems(quote, lineItems),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
      // Also invalidate the related request
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.detail(data.request_id),
      });
    },
  });
}

/**
 * Hook to update a quote with line items
 */
export function useUpdateQuote() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new QuoteRepository(supabase);

  return useMutation({
    mutationFn: ({
      id,
      quote,
      lineItems,
    }: {
      id: string;
      quote: QuoteUpdate;
      lineItems: Omit<QuoteLineItemInsert, "quote_id">[];
    }) => repo.updateWithLineItems(id, quote, lineItems),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });
    },
  });
}

/**
 * Hook to send a quote to client (admin action)
 */
export function useSendQuote() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const workflow = new WorkflowService(supabase);

  return useMutation({
    mutationFn: (quoteId: string) => workflow.sendQuote(quoteId),
    onSuccess: () => {
      // Invalidate quotes, requests, and all timelines
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}

/**
 * Hook to respond to a quote (client action)
 */
export function useRespondToQuote() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const workflow = new WorkflowService(supabase);

  return useMutation({
    mutationFn: ({
      quoteId,
      response,
      userId,
    }: {
      quoteId: string;
      response: QuoteResponse;
      userId: string;
    }) => workflow.respondToQuote(quoteId, response, userId),
    onSuccess: (result) => {
      // Invalidate quotes, requests, and all timelines
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      // If a job was created, invalidate jobs
      if (result.jobId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      }
    },
  });
}
