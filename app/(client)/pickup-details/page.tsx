"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, ArrowRight, Truck, AlertCircle, Loader2 } from "lucide-react";
import { useJobList } from "@/lib/hooks";
import { formatDateShort } from "@/lib/utils/date";
import type { JobListItem } from "@/lib/database/types";

function PickupCard({ job }: { job: JobListItem }) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <span className="font-mono text-sm font-medium">
              {job.job_number}
            </span>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateShort(job.pickup_date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location_summary}
              </span>
            </div>
            {job.equipment_summary && (
              <p className="text-sm text-muted-foreground">
                {job.equipment_summary}
              </p>
            )}
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

export default function PickupDetailsPage() {
  const { data: jobs, isLoading, error } = useJobList({ status: "pickup_scheduled" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Details"
        description="Track your pickup schedules and details"
      >
        <Button asChild>
          <Link href="/requests/new">
            <Truck className="mr-2 h-4 w-4" />
            Request Pickup
          </Link>
        </Button>
      </PageHeader>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>Failed to load pickup details. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !error && (
        <>
          {!jobs || jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No pickups scheduled yet</p>
                <Button asChild className="mt-4">
                  <Link href="/requests/new">Request a Pickup</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <PickupCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
