"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanySearch, useCompanyList } from "@/lib/hooks";

interface CompanySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CompanySelect({
  value,
  onValueChange,
  placeholder = "Select a company...",
}: CompanySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");

  // Preload initial companies (limited to 10)
  const { data: initialData, isLoading: loadingInitial } = useCompanyList(undefined, 1, 10);
  // Search results when user types
  const { data: searchResults = [], isLoading: loadingSearch, isFetching } = useCompanySearch(search, 20);

  const initialCompanies = initialData?.data ?? [];

  // Use search results if searching, otherwise use initial companies
  const isSearching = search.length >= 2;
  const companies = isSearching ? searchResults : initialCompanies;
  const showLoading = isSearching ? (loadingSearch || isFetching) : loadingInitial;

  // Update selected name when value changes externally
  useEffect(() => {
    if (!value) {
      setSelectedName("");
    }
  }, [value]);

  const handleSelect = (companyId: string, companyName: string) => {
    onValueChange(companyId);
    setSelectedName(companyName);
    setOpen(false);
    setSearch("");
  };

  const showNoResults = !showLoading && companies.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedName ? (
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {selectedName}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {showLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                {isSearching ? "Searching..." : "Loading..."}
              </span>
            </div>
          )}

          {showNoResults && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No companies found.
            </p>
          )}

          {!showLoading && companies.length > 0 && (
            <div className="p-1">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelect(company.id, company.name)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === company.id && "bg-accent"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === company.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col items-start">
                    <span>{company.name}</span>
                    {company.contact_email && (
                      <span className="text-xs text-muted-foreground">
                        {company.contact_email}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
