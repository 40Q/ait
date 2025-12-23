import Link from "next/link";
import { StatusBadge, type JobStatus } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Receipt } from "lucide-react";

interface Job {
  id: string;
  status: JobStatus;
  pickupDate: string;
  documentsCount: number;
  equipmentSummary: string;
  invoiceAmount?: number;
}

// Mock data - would come from API
const recentJobs: Job[] = [
  {
    id: "W2512003",
    status: "processing",
    pickupDate: "Dec 10, 2024",
    documentsCount: 2,
    equipmentSummary: "15 Laptops, 8 Desktops, 20 Hard Drives",
    invoiceAmount: 1250,
  },
  {
    id: "W2512002",
    status: "complete",
    pickupDate: "Dec 5, 2024",
    documentsCount: 4,
    equipmentSummary: "3 Servers, Networking Equipment",
    invoiceAmount: 3500,
  },
  {
    id: "W2512001",
    status: "complete",
    pickupDate: "Nov 28, 2024",
    documentsCount: 3,
    equipmentSummary: "25 Laptops",
    invoiceAmount: 890,
  },
  {
    id: "W2511004",
    status: "pickup_scheduled",
    pickupDate: "Dec 18, 2024",
    documentsCount: 0,
    equipmentSummary: "50 Hard Drives",
  },
  {
    id: "W2511003",
    status: "pickup_complete",
    pickupDate: "Dec 12, 2024",
    documentsCount: 1,
    equipmentSummary: "Mixed E-waste",
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
                <span className="font-mono font-medium">
                  Job #{job.id}
                </span>
                <StatusBadge status={job.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{job.equipmentSummary}</p>
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
