"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, type JobStatus } from "@/components/ui/status-badge";
import {
  Search,
  MoreHorizontal,
  Eye,
  Upload,
  FileText,
  AlertCircle,
} from "lucide-react";

interface JobListItem {
  id: string;
  companyId: string;
  companyName: string;
  status: JobStatus;
  pickupDate: string;
  createdAt: string;
  equipmentSummary: string;
  documentsCount: number;
  needsDocuments: boolean;
  invoiceNumber?: string;
  invoiceAmount?: number;
  invoiceStatus?: "paid" | "unpaid";
}

// Mock data
const jobs: JobListItem[] = [
  {
    id: "W2512008",
    companyId: "2",
    companyName: "TechStart Inc",
    status: "pickup_scheduled",
    pickupDate: "Dec 18, 2024",
    createdAt: "Dec 14, 2024",
    equipmentSummary: "5 Servers, 100 Hard Drives",
    documentsCount: 0,
    needsDocuments: false,
  },
  {
    id: "W2512007",
    companyId: "1",
    companyName: "Acme Corporation",
    status: "pickup_complete",
    pickupDate: "Dec 15, 2024",
    createdAt: "Dec 10, 2024",
    equipmentSummary: "25 Laptops, 10 Desktops",
    documentsCount: 1,
    needsDocuments: true,
  },
  {
    id: "W2512006",
    companyId: "3",
    companyName: "Global Systems",
    status: "processing",
    pickupDate: "Dec 12, 2024",
    createdAt: "Dec 8, 2024",
    equipmentSummary: "15 Monitors, 8 Printers, 30 Hard Drives",
    documentsCount: 2,
    needsDocuments: true,
  },
  {
    id: "W2512005",
    companyId: "4",
    companyName: "DataFlow LLC",
    status: "complete",
    pickupDate: "Dec 10, 2024",
    createdAt: "Dec 5, 2024",
    equipmentSummary: "50 Laptops, 20 Desktops, 100 Hard Drives",
    documentsCount: 5,
    needsDocuments: false,
    invoiceNumber: "INV-2024-1250",
    invoiceAmount: 3200,
    invoiceStatus: "unpaid",
  },
  {
    id: "W2512004",
    companyId: "1",
    companyName: "Acme Corporation",
    status: "complete",
    pickupDate: "Dec 5, 2024",
    createdAt: "Dec 1, 2024",
    equipmentSummary: "10 Servers, 200 Hard Drives",
    documentsCount: 4,
    needsDocuments: false,
    invoiceNumber: "INV-2024-1245",
    invoiceAmount: 4500,
    invoiceStatus: "paid",
  },
];

export default function AdminJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("all");

  const statusCounts = {
    all: jobs.length,
    pickup_scheduled: jobs.filter((j) => j.status === "pickup_scheduled").length,
    pickup_complete: jobs.filter((j) => j.status === "pickup_complete").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    complete: jobs.filter((j) => j.status === "complete" || j.status === "completed").length,
  };

  const filterJobs = (status: string) => {
    let filtered = jobs;

    if (status !== "all") {
      if (status === "complete") {
        filtered = filtered.filter(
          (j) => j.status === "complete" || j.status === "completed"
        );
      } else {
        filtered = filtered.filter((j) => j.status === status);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.id.toLowerCase().includes(query) ||
          j.companyName.toLowerCase().includes(query)
      );
    }

    if (companyFilter !== "all") {
      filtered = filtered.filter((j) => j.companyId === companyFilter);
    }

    if (invoiceFilter !== "all") {
      if (invoiceFilter === "invoiced") {
        filtered = filtered.filter((j) => j.invoiceNumber);
      } else if (invoiceFilter === "not_invoiced") {
        filtered = filtered.filter((j) => !j.invoiceNumber);
      } else if (invoiceFilter === "paid") {
        filtered = filtered.filter((j) => j.invoiceStatus === "paid");
      } else if (invoiceFilter === "unpaid") {
        filtered = filtered.filter((j) => j.invoiceStatus === "unpaid");
      }
    }

    return filtered;
  };

  // Get unique companies for filter
  const companies = Array.from(
    new Map(jobs.map((j) => [j.companyId, j.companyName])).entries()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Manage jobs and upload documents"
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Job ID or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Invoice Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="invoiced">Invoiced</SelectItem>
            <SelectItem value="not_invoiced">Not Invoiced</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pickup_scheduled">
            Scheduled ({statusCounts.pickup_scheduled})
          </TabsTrigger>
          <TabsTrigger value="pickup_complete">
            Picked Up ({statusCounts.pickup_complete})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({statusCounts.processing})
          </TabsTrigger>
          <TabsTrigger value="complete">
            Complete ({statusCounts.complete})
          </TabsTrigger>
        </TabsList>

        {["all", "pickup_scheduled", "pickup_complete", "processing", "complete"].map(
          (status) => (
            <TabsContent key={status} value={status} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead className="text-center">Docs</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterJobs(status).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Link
                            href={`/admin/jobs/${job.id}`}
                            className="font-mono text-sm font-medium hover:underline"
                          >
                            {job.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/companies/${job.companyId}`}
                            className="hover:underline"
                          >
                            {job.companyName}
                          </Link>
                        </TableCell>
                        <TableCell>{job.pickupDate}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {job.equipmentSummary}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{job.documentsCount}</span>
                            {job.needsDocuments && (
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.invoiceNumber ? (
                            <div>
                              <Link
                                href={`/admin/invoices/${job.invoiceNumber}`}
                                className="font-mono text-xs hover:underline"
                              >
                                {job.invoiceNumber}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs">
                                  ${job.invoiceAmount?.toLocaleString()}
                                </span>
                                <Badge
                                  variant={
                                    job.invoiceStatus === "paid"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    job.invoiceStatus === "paid"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : ""
                                  }
                                >
                                  {job.invoiceStatus}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Not invoiced
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={job.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/jobs/${job.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/jobs/${job.id}#documents`}>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Documents
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filterJobs(status).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No jobs found</p>
                </div>
              )}
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
