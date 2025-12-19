import Link from "next/link";
import { StatusBadge, type JobStatus } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Receipt } from "lucide-react";

interface Job {
  id: string;
  name: string;
  status: JobStatus;
  pickupDate: string;
  documentsCount: number;
  invoiceAmount?: number;
}

// Mock data - would come from API
const recentJobs: Job[] = [
  {
    id: "W2512003",
    name: "Q4 Office Equipment Recycling",
    status: "processing",
    pickupDate: "Dec 10, 2024",
    documentsCount: 2,
    invoiceAmount: 1250,
  },
  {
    id: "W2512002",
    name: "Server Room Decommission",
    status: "complete",
    pickupDate: "Dec 5, 2024",
    documentsCount: 4,
    invoiceAmount: 3500,
  },
  {
    id: "W2512001",
    name: "Laptop Trade-in Program",
    status: "complete",
    pickupDate: "Nov 28, 2024",
    documentsCount: 3,
    invoiceAmount: 890,
  },
  {
    id: "W2511004",
    name: "Hard Drive Destruction",
    status: "pickup_scheduled",
    pickupDate: "Dec 18, 2024",
    documentsCount: 0,
  },
  {
    id: "W2511003",
    name: "E-waste Collection",
    status: "pickup_complete",
    pickupDate: "Dec 12, 2024",
    documentsCount: 1,
  },
];

export function RecentJobsList() {
  return (
    <div className="space-y-4">
      {recentJobs.map((job) => (
        <div
          key={job.id}
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {job.id}
                </span>
                <StatusBadge status={job.status} />
              </div>
              <p className="mt-1 font-medium">{job.name}</p>
              <p className="text-sm text-muted-foreground">
                Pickup: {job.pickupDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {job.documentsCount}
              </span>
              {job.invoiceAmount && (
                <span className="flex items-center gap-1">
                  <Receipt className="h-4 w-4" />$
                  {job.invoiceAmount.toLocaleString()}
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
