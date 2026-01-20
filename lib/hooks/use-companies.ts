"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CompanyRepository } from "@/lib/database/repositories";
import {
  queryKeys,
  type CompanyFilters,
  type CompanyInsert,
  type CompanyUpdate,
  type CompanyLocationInsert,
  type CompanyLocationUpdate,
} from "@/lib/database/types";
import { getQueryOptions } from "./query-config";

/**
 * Hook to fetch a paginated list of companies with optional filters
 */
export function useCompanyList(
  filters?: CompanyFilters,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.companies.list(filters), page, pageSize],
    queryFn: () => repo.getListItems(filters, page, pageSize),
    placeholderData: keepPreviousData,
    ...getQueryOptions("list"),
  });
}

/**
 * Hook to fetch a single company by ID with stats
 */
export function useCompany(id: string) {
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => repo.findByIdWithStats(id),
    enabled: !!id,
    ...getQueryOptions("detail"),
  });
}

/**
 * Hook to search companies by name (for autocomplete/select)
 */
export function useCompanySearch(search: string, limit = 10) {
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.companies.all, "search", search],
    queryFn: () => repo.searchByName(search, limit),
    enabled: search.length >= 2,
    ...getQueryOptions("search"),
  });
}

/**
 * Hook to create a new company
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useMutation({
    mutationFn: (data: CompanyInsert) => repo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}

/**
 * Hook to update a company
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyUpdate }) =>
      repo.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.detail(id),
      });
    },
  });
}

/**
 * Hook to fetch active users for a company.
 * Uses admin API to filter out banned users.
 */
export function useCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: [...queryKeys.companies.detail(companyId), "users"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/companies/${companyId}/users`);
      if (!response.ok) {
        throw new Error("Failed to fetch company users");
      }
      return response.json() as Promise<{ id: string; email: string; full_name: string | null }[]>;
    },
    enabled: !!companyId,
  });
}

// ============================================
// COMPANY LOCATIONS
// ============================================

/**
 * Hook to fetch locations for a company
 */
export function useCompanyLocations(companyId: string) {
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.companies.detail(companyId), "locations"],
    queryFn: () => repo.getCompanyLocations(companyId),
    enabled: !!companyId,
  });
}

/**
 * Hook to fetch a single location
 */
export function useCompanyLocation(locationId: string) {
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useQuery({
    queryKey: ["locations", locationId],
    queryFn: () => repo.getLocation(locationId),
    enabled: !!locationId,
  });
}

/**
 * Hook to create a location
 */
export function useCreateCompanyLocation(companyId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useMutation({
    mutationFn: (data: CompanyLocationInsert) => repo.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.companies.detail(companyId), "locations"],
      });
    },
  });
}

/**
 * Hook to update a location
 */
export function useUpdateCompanyLocation(companyId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyLocationUpdate }) =>
      repo.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.companies.detail(companyId), "locations"],
      });
    },
  });
}

/**
 * Hook to delete a location
 */
export function useDeleteCompanyLocation(companyId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useMutation({
    mutationFn: (locationId: string) => repo.deleteLocation(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.companies.detail(companyId), "locations"],
      });
    },
  });
}

/**
 * Hook to set a location as primary
 */
export function useSetLocationAsPrimary(companyId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useMutation({
    mutationFn: (locationId: string) =>
      repo.setLocationAsPrimary(companyId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.companies.detail(companyId), "locations"],
      });
    },
  });
}
