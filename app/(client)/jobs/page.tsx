"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilters } from "@/components/ui/list-filters";
import { FileText, Receipt, ArrowRight, Calendar, Truck, Package } from "lucide-react";
import { useJobList, useListPage } from "@/lib/hooks";
import { jobStatusLabels, type JobListItem, type JobStatus } from "@/lib/database/types";
import { formatDateShort } from "@/lib/utils/date";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  ...Object.entries(jobStatusLabels).map(([value, label]) => ({ value, label })),
];

function JobCard({ job }: { job: JobListItem }) {
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
}

export default function JobsPage() {
  const { searchQuery, setSearchQuery, filters, setFilter } = useListPage<{
    status: string;
  }>({
    defaultFilters: { status: "all" },
  });

  const queryFilters = useMemo(
    () => ({
      search: searchQuery || undefined,
      status: filters.status !== "all" ? (filters.status as JobStatus) : undefined,
    }),
    [searchQuery, filters.status]
  );

  const { data: jobs = [], isLoading } = useJobList(queryFilters);

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
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by Job ID..."
        filters={[
          {
            value: filters.status,
            onChange: (value) => setFilter("status", value),
            options: statusOptions,
            className: "w-full sm:w-48",
          },
        ]}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : jobs.length === 0 ? (
        <EmptyState icon={Package} title="No jobs found" />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {!isLoading && jobs.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
