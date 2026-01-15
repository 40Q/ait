"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CompanyRepository } from "@/lib/database/repositories";
import {
  queryKeys,
  type CompanyFilters,
  type CompanyInsert,
  type CompanyUpdate,
} from "@/lib/database/types";

/**
 * Hook to fetch a list of companies with optional filters
 */
export function useCompanyList(filters?: CompanyFilters) {
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => repo.getListItems(filters),
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
 * Hook to fetch users for a company
 */
export function useCompanyUsers(companyId: string) {
  const supabase = createClient();
  const repo = new CompanyRepository(supabase);

  return useQuery({
    queryKey: [...queryKeys.companies.detail(companyId), "users"],
    queryFn: () => repo.getCompanyUsers(companyId),
    enabled: !!companyId,
  });
}
