import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw,
  DollarSign,
  CheckCircle,
  Clock,
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

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4">
        <span className="font-mono font-medium">{invoice.number}</span>
      </td>
      <td className="p-4">
        <Link
          href={`/jobs/${invoice.jobId}`}
          className="hover:text-primary hover:underline"
        >
          {invoice.jobId}
        </Link>
        <p className="text-sm text-muted-foreground">{invoice.jobName}</p>
      </td>
      <td className="p-4 text-muted-foreground">{invoice.date}</td>
      <td className="p-4 text-muted-foreground">{invoice.dueDate}</td>
      <td className="p-4 text-right font-medium">
        ${invoice.amount.toLocaleString()}
      </td>
      <td className="p-4">
        <StatusBadge status={invoice.status} />
      </td>
      <td className="p-4">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      </td>
    </tr>
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

      {/* Invoices Table */}
      <Card className="p-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Invoice #</th>
                  <th className="p-4 text-left font-medium">Job</th>
                  <th className="p-4 text-left font-medium">Date</th>
                  <th className="p-4 text-left font-medium">Due Date</th>
                  <th className="p-4 text-right font-medium">Amount</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
