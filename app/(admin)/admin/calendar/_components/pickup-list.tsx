"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ExternalLink,
  MapPin,
  Building2,
  Loader2,
} from "lucide-react";
import { generateGoogleCalendarUrl } from "@/lib/utils/google-calendar";
import type { JobListItem } from "@/lib/database/types";

interface PickupListProps {
  jobs: JobListItem[];
  isLoading: boolean;
}

export function PickupList({ jobs, isLoading }: PickupListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Pickups This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No scheduled pickups this month
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <PickupListItem key={job.id} job={job} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PickupListItem({ job }: { job: JobListItem }) {
  const pickupDate = new Date(job.pickup_date!);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[50px]">
          <div className="text-xs text-muted-foreground uppercase">
            {pickupDate.toLocaleDateString("en-US", { month: "short" })}
          </div>
          <div className="text-xl font-bold">{pickupDate.getDate()}</div>
        </div>
        <div>
          <Link
            href={`/admin/jobs/${job.id}`}
            className="font-medium hover:underline"
          >
            {job.job_number}
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {job.company_name}
            </span>
            {job.location_summary && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location_summary}
              </span>
            )}
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a
          href={generateGoogleCalendarUrl(job)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Add to Calendar
        </a>
      </Button>
    </div>
  );
}
