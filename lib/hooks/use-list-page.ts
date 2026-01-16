"use client";

import { useState, useMemo } from "react";

interface UseListPageOptions<TFilter> {
  defaultFilters?: Partial<TFilter>;
}

interface UseListPageReturn<TFilter> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: TFilter;
  setFilter: <K extends keyof TFilter>(key: K, value: TFilter[K]) => void;
  resetFilters: () => void;
}

/**
 * Hook for managing list page state (search, filters)
 *
 * @example
 * const { searchQuery, setSearchQuery, filters, setFilter } = useListPage({
 *   defaultFilters: { status: "all", type: "all" }
 * });
 */
export function useListPage<TFilter extends Record<string, unknown>>(
  options: UseListPageOptions<TFilter> = {}
): UseListPageReturn<TFilter> {
  const { defaultFilters = {} as TFilter } = options;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<TFilter>(defaultFilters as TFilter);

  const setFilter = <K extends keyof TFilter>(key: K, value: TFilter[K]) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterState(defaultFilters as TFilter);
  };

  const filters = useMemo(() => ({
    ...filterState,
    search: searchQuery || undefined,
  }), [filterState, searchQuery]) as TFilter;

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    resetFilters,
  };
}

/**
 * Simple hook for tab-based filtering
 */
export function useTabFilter(defaultValue: string) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return { activeTab, setActiveTab };
}
