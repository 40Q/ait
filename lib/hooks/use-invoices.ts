"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { InvoiceRepository } from "@/lib/database/repositories/invoices";
import { queryKeys, type InvoiceFilters, type InvoiceUpdate, type InvoiceListItem } from "@/lib/database/types";
import { getQueryOptions } from "./query-config";

/**
 * Hook to fetch a paginated list of invoices with optional filters
 */
export function useInvoiceList(
  filters?: InvoiceFilters,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = createClient();
  const repo = new InvoiceRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.invoices.list(filters), page, pageSize],
    queryFn: () => repo.getListItems(filters, page, pageSize),
    placeholderData: keepPreviousData,
    ...getQueryOptions("list"),
  });
}

/**
 * Hook to fetch a single invoice by ID with all relations
 */
export function useInvoice(id: string) {
  const supabase = createClient();
  const repo = new InvoiceRepository(supabase);

  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => repo.findByIdWithRelations(id),
    enabled: !!id,
    ...getQueryOptions("detail"),
  });
}

/**
 * Hook to fetch invoices for a specific job
 */
export function useJobInvoices(jobId: string | undefined) {
  const supabase = createClient();
  const repo = new InvoiceRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.invoices.all, "job", jobId],
    queryFn: () => (jobId ? repo.getByJobId(jobId) : []),
    enabled: !!jobId,
    ...getQueryOptions("list"),
  });
}

/**
 * Hook to fetch invoice status counts
 */
export function useInvoiceStatusCounts(companyId?: string) {
  const supabase = createClient();
  const repo = new InvoiceRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.invoices.all, "counts", companyId],
    queryFn: () => repo.getStatusCounts(companyId),
    ...getQueryOptions("counts"),
  });
}

/**
 * Hook to update an invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new InvoiceRepository(supabase);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceUpdate }) =>
      repo.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) });
    },
  });
}

/**
 * Hook to link an invoice to a job
 */
export function useLinkInvoiceToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, jobId }: { invoiceId: string; jobId: string | null }) => {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to link invoice");
      }

      return response.json();
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

/**
 * Hook to sync invoices from QuickBooks
 */
export function useSyncInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/quickbooks/sync-invoices", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync invoices");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

/**
 * Hook to get QuickBooks connection status
 */
export function useQuickBooksStatus() {
  return useQuery({
    queryKey: ["quickbooks", "status"],
    queryFn: async () => {
      const response = await fetch("/api/quickbooks/status");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check status");
      }
      return response.json();
    },
    ...getQueryOptions("detail"),
  });
}

/**
 * Hook to disconnect from QuickBooks
 */
export function useDisconnectQuickBooks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/quickbooks/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quickbooks"] });
    },
  });
}

/**
 * Hook to subscribe to real-time invoice updates
 */
export function useRealtimeInvoices(companyId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("invoices-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          ...(companyId ? { filter: `company_id=eq.${companyId}` } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, companyId]);
}

/**
 * Hook to download an invoice PDF from QuickBooks
 */
export function useDownloadInvoicePdf() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadPdf = useCallback(async (invoice: InvoiceListItem) => {
    if (!invoice.quickbooks_id) {
      throw new Error("Invoice not synced from QuickBooks");
    }

    setDownloadingId(invoice.id);
    try {
      const response = await fetch(`/api/quickbooks/invoice/${invoice.id}/pdf`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return { downloadPdf, downloadingId };
}

/**
 * Hook to fetch invoice statistics (server-side calculation)
 */
export function useInvoiceStats(companyId?: string) {
  const supabase = createClient();
  const repo = new InvoiceRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.invoices.all, "stats", companyId],
    queryFn: () => repo.getStats(companyId),
    ...getQueryOptions("counts"),
  });
}

/**
 * Hook to filter invoices with search, status, and linked filters
 */
export function useInvoiceFilters(invoices: InvoiceListItem[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [linkedFilter, setLinkedFilter] = useState("all");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        invoice.company_name.toLowerCase().includes(searchLower) ||
        (invoice.job_number?.toLowerCase().includes(searchLower) ?? false);

      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      const matchesLinked =
        linkedFilter === "all" ||
        (linkedFilter === "linked" && invoice.job_id) ||
        (linkedFilter === "not_linked" && !invoice.job_id);

      return matchesSearch && matchesStatus && matchesLinked;
    });
  }, [invoices, searchQuery, statusFilter, linkedFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    linkedFilter,
    setLinkedFilter,
    filteredInvoices,
  };
}
