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
import { StatusBadge, type JobStatus } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Receipt,
  ArrowRight,
  Calendar,
  Truck,
} from "lucide-react";

interface Job {
  id: string;
  name: string;
  status: JobStatus;
  pickupDate: string;
  createdAt: string;
  documentsCount: number;
  invoiceAmount?: number;
  invoiceStatus?: "paid" | "unpaid";
}

// Mock data
const jobs: Job[] = [
  {
    id: "W2512003",
    name: "Q4 Office Equipment Recycling",
    status: "processing",
    pickupDate: "Dec 10, 2024",
    createdAt: "Dec 8, 2024",
    documentsCount: 2,
    invoiceAmount: 1250,
    invoiceStatus: "unpaid",
  },
  {
    id: "W2512002",
    name: "Server Room Decommission",
    status: "complete",
    pickupDate: "Dec 5, 2024",
    createdAt: "Dec 1, 2024",
    documentsCount: 4,
    invoiceAmount: 3500,
    invoiceStatus: "paid",
  },
  {
    id: "W2512001",
    name: "Laptop Trade-in Program",
    status: "complete",
    pickupDate: "Nov 28, 2024",
    createdAt: "Nov 25, 2024",
    documentsCount: 3,
    invoiceAmount: 890,
    invoiceStatus: "paid",
  },
  {
    id: "W2511004",
    name: "Hard Drive Destruction",
    status: "pickup_scheduled",
    pickupDate: "Dec 18, 2024",
    createdAt: "Dec 15, 2024",
    documentsCount: 0,
  },
  {
    id: "W2511003",
    name: "E-waste Collection",
    status: "pickup_complete",
    pickupDate: "Dec 12, 2024",
    createdAt: "Dec 10, 2024",
    documentsCount: 1,
  },
  {
    id: "W2511002",
    name: "Monitor Recycling Batch",
    status: "complete",
    pickupDate: "Nov 20, 2024",
    createdAt: "Nov 15, 2024",
    documentsCount: 3,
    invoiceAmount: 450,
    invoiceStatus: "paid",
  },
];

function JobCard({ job }: { job: Job }) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {job.id}
              </span>
              <StatusBadge status={job.status} />
            </div>
            <p className="font-medium">{job.name}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Pickup: {job.pickupDate}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {job.documentsCount} docs
              </span>
              {job.invoiceAmount && (
                <span className="flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5" />$
                  {job.invoiceAmount.toLocaleString()}
                  {job.invoiceStatus && (
                    <Badge
                      variant="outline"
                      className={
                        job.invoiceStatus === "paid"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-yellow-200 bg-yellow-50 text-yellow-700"
                      }
                    >
                      {job.invoiceStatus}
                    </Badge>
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
          <Input placeholder="Search by job ID or name..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
            <SelectItem value="pickup_complete">Pickup Complete</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Invoice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="none">No Invoice</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing 1-6 of 6 jobs</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
