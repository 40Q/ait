import { cn } from "@/lib/utils";
import { Check, Clock } from "lucide-react";

type ClientJobStatus = "pickup_scheduled" | "pickup_complete" | "processing" | "complete";

interface TimelineStep {
  id: ClientJobStatus;
  label: string;
  date?: string;
}

interface JobTimelineProps {
  currentStatus: ClientJobStatus;
  timeline: {
    quoteAccepted?: string;
    pickupScheduled?: string;
    pickupComplete?: string;
    processing?: string;
    complete?: string;
  };
}

const statusOrder: ClientJobStatus[] = [
  "pickup_scheduled",
  "pickup_complete",
  "processing",
  "complete",
];

const statusLabels: Record<ClientJobStatus, string> = {
  pickup_scheduled: "Pickup Scheduled",
  pickup_complete: "Pickup Complete",
  processing: "Processing",
  complete: "Complete",
};

export function JobTimeline({ currentStatus, timeline }: JobTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  const steps: TimelineStep[] = statusOrder.map((status) => ({
    id: status,
    label: statusLabels[status],
    date:
      timeline[
        status === "pickup_scheduled"
          ? "pickupScheduled"
          : status === "pickup_complete"
          ? "pickupComplete"
          : status
      ],
  }));

  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute left-4 top-4 h-[calc(100%-32px)] w-0.5 bg-muted md:left-1/2 md:h-0.5 md:w-[calc(100%-64px)] md:-translate-x-1/2 md:top-4" />
      <div
        className="absolute left-4 top-4 w-0.5 bg-primary transition-all duration-500 md:left-[32px] md:h-0.5 md:top-4"
        style={{
          height: `calc(${((currentIndex + 1) / steps.length) * 100}% - 32px)`,
        }}
      />

      {/* Steps */}
      <div className="relative flex flex-col gap-8 md:flex-row md:justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.id}
              className="flex items-start gap-4 md:flex-col md:items-center md:gap-2"
            >
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              <div className="md:text-center">
                <p
                  className={cn(
                    "font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs text-muted-foreground">{step.date}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
