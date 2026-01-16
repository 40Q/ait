/**
 * Shared React Query configuration for cache timing
 */

// Cache durations in milliseconds
const MINUTE = 1000 * 60;

export const QUERY_CACHE_TIME = {
  /** For list queries - shorter cache since lists change frequently */
  list: MINUTE * 2,
  /** For detail queries - longer cache since individual items change less often */
  detail: MINUTE * 5,
  /** For count/aggregate queries - short cache for accuracy */
  counts: MINUTE * 1,
  /** For search/autocomplete - short cache */
  search: MINUTE * 1,
} as const;

/**
 * Get query options with standard cache settings
 */
export function getQueryOptions(type: keyof typeof QUERY_CACHE_TIME) {
  const staleTime = QUERY_CACHE_TIME[type];
  return {
    staleTime,
    gcTime: staleTime * 2,
  };
}
