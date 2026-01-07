import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type InvoiceStatus } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  Search,
  Download,
  ExternalLink,
  DollarSign,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";

interface Invoice {
  id: string;
  number: string;
  jobId: string;
  jobName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
}

// Mock data
const invoices: Invoice[] = [
  {
    id: "1",
    number: "INV-2024-1234",
    jobId: "W2512003",
    jobName: "Q4 Office Equipment Recycling",
    date: "Dec 15, 2024",
    dueDate: "Jan 15, 2025",
    amount: 1200,
    status: "unpaid",
  },
  {
    id: "2",
    number: "INV-2024-1198",
    jobId: "W2512002",
    jobName: "Server Room Decommission",
    date: "Dec 10, 2024",
    dueDate: "Jan 10, 2025",
    amount: 3500,
    status: "paid",
  },
  {
    id: "3",
    number: "INV-2024-1156",
    jobId: "W2512001",
    jobName: "Laptop Trade-in Program",
    date: "Dec 3, 2024",
    dueDate: "Jan 3, 2025",
    amount: 890,
    status: "paid",
  },
  {
    id: "4",
    number: "INV-2024-1089",
    jobId: "W2511002",
    jobName: "Monitor Recycling Batch",
    date: "Nov 25, 2024",
    dueDate: "Dec 25, 2024",
    amount: 450,
    status: "overdue",
  },
];

const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
const totalPaid = invoices
  .filter((inv) => inv.status === "paid")
  .reduce((sum, inv) => sum + inv.amount, 0);
const totalOutstanding = totalInvoiced - totalPaid;

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-medium">{invoice.number}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <div>
              <Link
                href={`/jobs/${invoice.jobId}`}
                className="text-sm hover:text-primary hover:underline"
              >
                {invoice.jobId}
              </Link>
              <span className="text-sm text-muted-foreground"> - {invoice.jobName}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {invoice.date}
              </span>
              <span className={invoice.status === "overdue" ? "text-destructive" : ""}>
                Due: {invoice.dueDate}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-lg font-bold">
              ${invoice.amount.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View</span>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="View and manage all your invoices"
      ></PageHeader>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Invoiced"
          value={`$${totalInvoiced.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Paid"
          value={`$${totalPaid.toLocaleString()}`}
          icon={CheckCircle}
        />
        <StatCard
          title="Outstanding"
          value={`$${totalOutstanding.toLocaleString()}`}
          description={`${invoices.filter((i) => i.status !== "paid").length} invoices`}
          icon={Clock}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by job..."
            className="pl-9"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing 1-{invoices.length} of {invoices.length} invoices</span>
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
