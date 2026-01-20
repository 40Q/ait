"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateGoogleCalendarUrl } from "@/lib/utils/google-calendar";
import type { JobListItem, JobStatus } from "@/lib/database/types";

const STATUS_COLORS: Record<string, string> = {
  needs_scheduling: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pickup_scheduled: "bg-blue-100 text-blue-800 border-blue-200",
};

interface JobEventProps {
  job: JobListItem;
}

export function JobEvent({ job }: JobEventProps) {
  return (
    <div
      className={cn(
        "text-xs p-1 rounded border truncate group relative",
        STATUS_COLORS[job.status] || "bg-gray-100 text-gray-800 border-gray-200"
      )}
    >
      <Link href={`/admin/jobs/${job.id}`} className="hover:underline">
        {job.company_name}
      </Link>

      {/* Hover card with Google Calendar link */}
      <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
        <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[200px]">
          <div className="font-medium mb-1">{job.job_number}</div>
          <div className="text-muted-foreground mb-2">{job.company_name}</div>
          <a
            href={generateGoogleCalendarUrl(job)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Add to Google Calendar
          </a>
        </div>
      </div>
    </div>
  );
}
