import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type JobStatus =
  | "pickup_scheduled"
  | "pickup_complete"
  | "in_progress"
  | "processing"
  | "complete"
  | "completed";

export type RequestStatus =
  | "pending"
  | "quote_ready"
  | "quote_sent"
  | "revision_requested"
  | "accepted"
  | "declined";

export type QuoteStatus = "draft" | "sent" | "expired";

export type InvoiceStatus = "paid" | "unpaid" | "overdue";

type Status = JobStatus | RequestStatus | QuoteStatus | InvoiceStatus;

const statusConfig: Record<
  Status,
  { label: string; className: string }
> = {
  // Job statuses
  pickup_scheduled: {
    label: "Pickup Scheduled",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  pickup_complete: {
    label: "Pickup Complete",
    className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  processing: {
    label: "Processing",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  complete: {
    label: "Complete",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  // Request statuses
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  quote_ready: {
    label: "Quote Ready",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  quote_sent: {
    label: "Quote Sent",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  accepted: {
    label: "Accepted",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  declined: {
    label: "Declined",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  // Quote statuses
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  expired: {
    label: "Expired",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  },
  // Invoice statuses
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
