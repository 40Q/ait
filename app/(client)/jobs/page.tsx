"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Search,
  FileText,
  Receipt,
  ArrowRight,
  Calendar,
  Truck,
  Loader2,
} from "lucide-react";
import { useJobList } from "@/lib/hooks";
import { jobStatusLabels, type JobListItem, type JobStatus } from "@/lib/database/types";
import { formatDateShort } from "@/lib/utils/date";

const allStatuses = Object.keys(jobStatusLabels) as JobStatus[];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filters = useMemo(
    () => ({
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? (statusFilter as JobStatus) : undefined,
    }),
    [searchQuery, statusFilter]
  );

  const { data: jobs = [], isLoading } = useJobList(filters);

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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Job ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {jobStatusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && jobs.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
