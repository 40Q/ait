"use client";

import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  value: string;
  label: string;
}

interface SelectFilterConfig {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
}

interface ListFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: SelectFilterConfig[];
  className?: string;
  /** Shows a loading spinner in the search input when true */
  isLoading?: boolean;
}

/**
 * Reusable filter bar for list pages
 *
 * @example
 * <ListFilters
 *   searchValue={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   searchPlaceholder="Search jobs..."
 *   filters={[
 *     {
 *       value: statusFilter,
 *       onChange: setStatusFilter,
 *       options: [
 *         { value: "all", label: "All Status" },
 *         { value: "active", label: "Active" },
 *       ],
 *     },
 *   ]}
 * />
 */
export function ListFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  className,
  isLoading = false,
}: ListFiltersProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-4 sm:flex-row">
        {onSearchChange && (
          <div className="relative flex-1">
            {isLoading ? (
              <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        {filters.map((filter, index) => (
          <Select
            key={index}
            value={filter.value}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className={filter.className ?? "w-full sm:w-40"}>
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
}
