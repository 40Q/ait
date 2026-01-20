"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, Search, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

interface QuickBooksCustomer {
  id: string;
  displayName: string;
  companyName?: string;
  email?: string;
}

interface QuickBooksCustomerSelectProps {
  value: string;
  onChange: (customerId: string, customerName?: string) => void;
  disabled?: boolean;
}

export function QuickBooksCustomerSelect({
  value,
  onChange,
  disabled,
}: QuickBooksCustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<QuickBooksCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<QuickBooksCustomer | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  // Fetch customers from API
  const fetchCustomers = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const response = await fetch(`/api/quickbooks/customers?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch customers");
      }

      setCustomers(data.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch customers");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when search changes
  useEffect(() => {
    if (open) {
      fetchCustomers(debouncedSearch);
    }
  }, [debouncedSearch, open, fetchCustomers]);

  // Load initial customer data if value is set
  useEffect(() => {
    if (value && !selectedCustomer) {
      // Try to find the customer in the current list
      const found = customers.find((c) => c.id === value);
      if (found) {
        setSelectedCustomer(found);
      }
    }
  }, [value, customers, selectedCustomer]);

  const handleSelect = (customer: QuickBooksCustomer) => {
    setSelectedCustomer(customer);
    onChange(customer.id, customer.displayName);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    onChange("");
    setSearch("");
  };

  const displayValue = selectedCustomer?.displayName || (value ? `ID: ${value}` : "");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !displayValue && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {displayValue || "Search QuickBooks customers..."}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {displayValue && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {error ? (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : customers.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {isLoading
                ? "Loading..."
                : search
                ? "No customers found"
                : "Type to search customers"}
            </div>
          ) : (
            <div className="p-1">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    value === customer.id && "bg-accent"
                  )}
                >
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {customer.displayName}
                    </div>
                    {(customer.companyName || customer.email) && (
                      <div className="text-xs text-muted-foreground truncate">
                        {customer.companyName && customer.email
                          ? `${customer.companyName} - ${customer.email}`
                          : customer.companyName || customer.email}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      ID: {customer.id}
                    </div>
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
