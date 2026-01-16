"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRight, FileText, Receipt, Briefcase } from "lucide-react";
import { useJobList } from "@/lib/hooks";
import { formatDateShort } from "@/lib/utils/date";

export function RecentJobsList() {
  const { data: jobs = [], isLoading } = useJobList();

  if (isLoading) {
    return <LoadingSpinner size="sm" className="py-8" />;
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No jobs yet"
        description="Submit a pickup request to get started."
        className="py-8"
      />
    );
  }

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-4">
      {recentJobs.map((job) => (
        <div
          key={job.id}
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">Job #{job.job_number}</span>
              <StatusBadge status={job.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.equipment_summary || `${job.equipment_count} items`}
            </p>
            <p className="text-sm text-muted-foreground">
              Pickup: {formatDateShort(job.pickup_date)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {job.document_count}
              </span>
              {job.invoice_total && (
                <span className="flex items-center gap-1">
                  <Receipt className="h-4 w-4" />
                  ${job.invoice_total.toLocaleString()}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/jobs/${job.id}`}>
                View
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
