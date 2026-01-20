"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Pencil,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { FetchingIndicator } from "@/components/ui/fetching-indicator";
import { useCompanyList, usePagination } from "@/lib/hooks";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { CompanyListItem } from "@/lib/database/types";

type QuickBooksStatus = "connected" | "error" | "not_connected";

function QuickBooksStatusBadge({ status }: { status: QuickBooksStatus }) {
  switch (status) {
    case "connected":
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs">Connected</span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">Error</span>
        </div>
      );
    case "not_connected":
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <XCircle className="h-4 w-4" />
          <span className="text-xs">Not Connected</span>
        </div>
      );
  }
}

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Pagination
  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 20,
  });

  // Build filters
  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
  }), [debouncedSearch]);

  const { data: paginatedData, isLoading, isFetching, error } = useCompanyList(filters, currentPage, pageSize);

  // Reset to page 1 when search changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  }, [setPage]);

  const companies = paginatedData?.data ?? [];

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load companies: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage client companies and their portal access"
      >
        <Button asChild>
          <Link href="/admin/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          {isFetching ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <FetchingIndicator isFetching={isFetching}>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead>QuickBooks</TableHead>
              <TableHead className="text-center">Jobs</TableHead>
              <TableHead className="text-center">Pending Requests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-muted-foreground">No companies found</p>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="font-medium hover:underline"
                      >
                        {company.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.contact_email || "-"}
                  </TableCell>
                  <TableCell>
                    <QuickBooksStatusBadge status={company.quickbooks_status} />
                  </TableCell>
                  <TableCell className="text-center">{company.job_count}</TableCell>
                  <TableCell className="text-center">{company.pending_request_count}</TableCell>
                  <TableCell>
                    <Badge
                      variant={company.status === "active" ? "default" : "secondary"}
                    >
                      {company.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/companies/${company.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </FetchingIndicator>

      {/* Pagination */}
      {paginatedData && paginatedData.totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginatedData.totalPages}
          totalItems={paginatedData.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
