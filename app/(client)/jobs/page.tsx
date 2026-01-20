"use client";

import { useMemo, memo, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilters } from "@/components/ui/list-filters";
import { FetchingIndicator } from "@/components/ui/fetching-indicator";
import { FileText, Receipt, ArrowRight, Calendar, Truck, Package } from "lucide-react";
import { useJobList, usePagination } from "@/lib/hooks";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { jobStatusLabels, type JobListItem, type JobStatus } from "@/lib/database/types";
import { formatDateShort } from "@/lib/utils/date";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  ...Object.entries(jobStatusLabels).map(([value, label]) => ({ value, label })),
];

const JobCard = memo(function JobCard({ job }: { job: JobListItem }) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">Job #{job.job_number}</span>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {job.equipment_summary || `${job.equipment_count} items`}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Pickup: {formatDateShort(job.pickup_date)}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {job.document_count} docs
              </span>
              {job.invoice_total && (
                <span className="flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5" />
                  ${job.invoice_total.toLocaleString()}
                  {job.invoice_status && (
                    <StatusBadge status={job.invoice_status as "paid" | "unpaid" | "overdue"} />
                  )}
                </span>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/jobs/${job.id}`}>
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Pagination
  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 20,
  });

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter !== "all" ? (statusFilter as JobStatus) : undefined,
    }),
    [debouncedSearch, statusFilter]
  );

  const { data: paginatedData, isLoading, isFetching } = useJobList(queryFilters, currentPage, pageSize);

  const jobs = paginatedData?.data ?? [];

  // Reset to page 1 when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, [setPage]);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, [setPage]);

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" description="View all your recycling jobs">
        <Button asChild>
          <Link href="/requests/new">
            <Truck className="mr-2 h-4 w-4" />
            Request Pickup
          </Link>
        </Button>
      </PageHeader>

      <ListFilters
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by Job ID..."
        isLoading={isFetching}
        filters={[
          {
            value: statusFilter,
            onChange: handleStatusChange,
            options: statusOptions,
            className: "w-full sm:w-48",
          },
        ]}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FetchingIndicator isFetching={isFetching}>
          {jobs.length === 0 ? (
            <EmptyState icon={Package} title="No jobs found" />
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </FetchingIndicator>
      )}

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
