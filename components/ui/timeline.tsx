"use client";

import { useTimeline } from "@/lib/hooks";
import { formatDateTime } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock } from "lucide-react";
import type { TimelineEntityType, TimelineEventWithActor } from "@/lib/database/types";

const statusLabels: Record<string, string> = {
  // Request statuses
  pending: "Pending",
  quote_ready: "Quote Ready",
  accepted: "Accepted",
  declined: "Declined",
  // Job statuses
  pickup_scheduled: "Pickup Scheduled",
  pickup_complete: "Pickup Complete",
  processing: "Processing",
  complete: "Complete",
  // Quote statuses
  draft: "Draft",
  sent: "Sent",
  revision_requested: "Revision Requested",
};

function getTimelineEventDetails(event: TimelineEventWithActor): {
  title: string;
  description?: string;
} {
  switch (event.event_type) {
    case "created":
      return { title: "Request Submitted" };
    case "status_change":
      return {
        title: `Status changed to ${statusLabels[event.new_value ?? ""] || event.new_value}`,
        description: event.previous_value
          ? `From ${statusLabels[event.previous_value] || event.previous_value}`
          : undefined,
      };
    case "declined":
      return {
        title: "Request Declined",
        description: event.new_value || undefined,
      };
    case "note":
      return {
        title: "Note Added",
        description: event.new_value || undefined,
      };
    default:
      return { title: "Event" };
  }
}

interface TimelineProps {
  entityType: TimelineEntityType;
  entityId: string;
  title?: string;
  showCard?: boolean;
  showActors?: boolean;
}

export function Timeline({
  entityType,
  entityId,
  title = "Timeline",
  showCard = true,
  showActors = true,
}: TimelineProps) {
  const { data: events = [], isLoading } = useTimeline(entityType, entityId);

  const content = (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No timeline events yet.</p>
      ) : (
        events.map((event, index) => {
          const { title, description } = getTimelineEventDetails(event);
          const isLast = index === events.length - 1;
          const isDeclined = event.event_type === "declined";

          return (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isDeclined ? "bg-destructive" : "bg-primary"
                  }`}
                />
                {!isLast && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-4">
                <p
                  className={`text-sm font-medium ${
                    isDeclined ? "text-destructive" : ""
                  }`}
                >
                  {title}
                </p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(event.created_at)}
                </p>
                {showActors && event.actor && (
                  <p className="text-xs text-muted-foreground">
                    by {event.actor.full_name || event.actor.email}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
