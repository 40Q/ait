"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type InvoiceStatus } from "@/components/ui/status-badge";
import {
  Search,
  RefreshCw,
  ExternalLink,
  Download,
  Link as LinkIcon,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  jobId?: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  quickbooksSyncedAt: string;
}

// Mock data
const invoices: InvoiceItem[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-1250",
    companyId: "4",
    companyName: "DataFlow LLC",
    jobId: "W2512005",
    date: "Dec 15, 2024",
    dueDate: "Jan 15, 2025",
    amount: 3200,
    status: "unpaid",
    quickbooksSyncedAt: "Today at 2:30 PM",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-1248",
    companyId: "1",
    companyName: "Acme Corporation",
    jobId: "W2512004",
    date: "Dec 10, 2024",
    dueDate: "Jan 10, 2025",
    amount: 4500,
    status: "paid",
    quickbooksSyncedAt: "Today at 2:30 PM",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-1245",
    companyId: "3",
    companyName: "Global Systems",
    jobId: "W2512003",
    date: "Dec 5, 2024",
    dueDate: "Jan 5, 2025",
    amount: 2800,
    status: "unpaid",
    quickbooksSyncedAt: "Today at 2:30 PM",
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-1240",
    companyId: "2",
    companyName: "TechStart Inc",
    date: "Dec 1, 2024",
    dueDate: "Dec 31, 2024",
    amount: 1500,
    status: "overdue",
    quickbooksSyncedAt: "Today at 2:30 PM",
  },
  {
    id: "5",
    invoiceNumber: "INV-2024-1235",
    companyId: "1",
    companyName: "Acme Corporation",
    jobId: "W2512002",
    date: "Nov 28, 2024",
    dueDate: "Dec 28, 2024",
    amount: 5200,
    status: "paid",
    quickbooksSyncedAt: "Today at 2:30 PM",
  },
];

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [linkedFilter, setLinkedFilter] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.jobId &&
        invoice.jobId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    const matchesLinked =
      linkedFilter === "all" ||
      (linkedFilter === "linked" && invoice.jobId) ||
      (linkedFilter === "not_linked" && !invoice.jobId);

    return matchesSearch && matchesStatus && matchesLinked;
  });

  // Calculate stats
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidAmount = invoices
    .filter((inv) => inv.status === "unpaid" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const unlinkedCount = invoices.filter((inv) => !inv.jobId).length;

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage invoices synced from QuickBooks"
      >
        <Button onClick={handleSync} disabled={isSyncing}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
          />
          {isSyncing ? "Syncing..." : "Sync All Companies"}
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Invoiced"
          value={`$${totalAmount.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Paid"
          value={`$${paidAmount.toLocaleString()}`}
          icon={CheckCircle2}
        />
        <StatCard
          title="Outstanding"
          value={`$${unpaidAmount.toLocaleString()}`}
          icon={Clock}
        />
        <StatCard
          title="Unlinked"
          value={unlinkedCount}
          description="Need to link to jobs"
          icon={AlertCircle}
        />
      </div>

      {/* Sync Status */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">QuickBooks Connected</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Last synced: Today at 2:30 PM
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings">
                Configure
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice #, company, or job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={linkedFilter} onValueChange={setLinkedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Linked Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="linked">Linked to Job</SelectItem>
            <SelectItem value="not_linked">Not Linked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Linked Job</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <span className="font-mono font-medium">
                    {invoice.invoiceNumber}
                  </span>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/companies/${invoice.companyId}`}
                    className="hover:underline"
                  >
                    {invoice.companyName}
                  </Link>
                </TableCell>
                <TableCell>
                  {invoice.jobId ? (
                    <Link
                      href={`/admin/jobs/${invoice.jobId}`}
                      className="font-mono text-sm hover:underline"
                    >
                      {invoice.jobId}
                    </Link>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-auto py-1 px-2">
                      <LinkIcon className="mr-1 h-3 w-3" />
                      Link to Job
                    </Button>
                  )}
                </TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell>
                  <span
                    className={
                      invoice.status === "overdue" ? "text-red-500" : ""
                    }
                  >
                    {invoice.dueDate}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${invoice.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" title="View in QuickBooks">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Download PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No invoices found</p>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredInvoices.length} of {invoices.length} invoices
      </p>
    </div>
  );
}
