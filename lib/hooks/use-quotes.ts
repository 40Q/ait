"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QuoteRepository } from "@/lib/database/repositories";
import {
  queryKeys,
  type QuoteFilters,
  type QuoteInsert,
  type QuoteUpdate,
  type QuoteResponse,
  type QuoteLineItemInsert,
} from "@/lib/database/types";
import { getQueryOptions } from "./query-config";

/**
 * Hook to fetch a paginated list of quotes with optional filters
 */
export function useQuoteList(
  filters?: QuoteFilters,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = createClient();
  const repo = new QuoteRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.quotes.list(filters), page, pageSize],
    queryFn: () => repo.getListItems(filters, page, pageSize),
    placeholderData: keepPreviousData,
    ...getQueryOptions("list"),
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
 * Calls server-side API route so notifications are sent reliably.
 */
export function useSendQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch("/api/workflow/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send quote");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}

/**
 * Hook to respond to a quote (client action)
 * Calls server-side API route so notifications are sent reliably.
 */
export function useRespondToQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quoteId,
      response,
    }: {
      quoteId: string;
      response: QuoteResponse;
      userId: string;
    }) => {
      const res = await fetch("/api/workflow/respond-to-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, response }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to respond to quote");
      }
      return res.json() as Promise<{ success: boolean; jobId: string | null }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      if (result.jobId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      }
    },
  });
}
