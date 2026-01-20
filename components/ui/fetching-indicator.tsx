"use client";

import { cn } from "@/lib/utils";

interface FetchingIndicatorProps {
  /** Whether data is currently being fetched */
  isFetching: boolean;
  /** Content to wrap */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Wraps content and shows a subtle loading state when fetching.
 * Adds reduced opacity and a loading bar at the top.
 *
 * @example
 * <FetchingIndicator isFetching={isFetching}>
 *   <Table>...</Table>
 * </FetchingIndicator>
 */
export function FetchingIndicator({
  isFetching,
  children,
  className,
}: FetchingIndicatorProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Loading bar at top */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 z-10 h-0.5 overflow-hidden bg-muted">
          <div className="h-full w-1/3 bg-primary animate-[shimmer_1s_ease-in-out_infinite]" />
        </div>
      )}
      {/* Content with reduced opacity when fetching */}
      <div
        className={cn(
          "transition-opacity duration-200",
          isFetching && "opacity-60 pointer-events-none"
        )}
      >
        {children}
      </div>
    </div>
  );
}
