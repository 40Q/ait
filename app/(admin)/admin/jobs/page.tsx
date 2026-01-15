"use client";

import { useState, useMemo } from "react";
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
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Search,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";
import { useJobList, useJobStatusCounts, useRealtimeJobs } from "@/lib/hooks";
import { formatDateShort } from "@/lib/utils/date";
import type { JobStatus } from "@/lib/database/types";

export default function AdminJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // Enable real-time updates
  useRealtimeJobs();

  // Fetch jobs with filters
  const filters = useMemo(() => ({
    status: activeTab !== "all" ? (activeTab as JobStatus) : undefined,
  }), [activeTab]);

  const { data: jobs = [], isLoading, error } = useJobList(filters);
  const { data: statusCounts } = useJobStatusCounts();

  // Client-side filtering for search (by job ID or company name) and invoice status
  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Filter by search query (job number or company name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.job_number.toLowerCase().includes(query) ||
        j.company_name.toLowerCase().includes(query)
      );
    }

    // Filter by invoice status
    if (invoiceFilter === "invoiced") {
      result = result.filter(j => j.invoice_total !== null);
    } else if (invoiceFilter === "not_invoiced") {
      result = result.filter(j => j.invoice_total === null);
    } else if (invoiceFilter === "paid") {
      result = result.filter(j => j.invoice_status === "paid");
    } else if (invoiceFilter === "unpaid") {
      result = result.filter(j => j.invoice_status === "unpaid" || j.invoice_status === "overdue");
    }

    return result;
  }, [jobs, searchQuery, invoiceFilter]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load jobs: {error.message}</p>
      </div>
    );
  }

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts?.all ?? 0})</TabsTrigger>
          <TabsTrigger value="pickup_scheduled">
            Scheduled ({statusCounts?.pickup_scheduled ?? 0})
          </TabsTrigger>
          <TabsTrigger value="pickup_complete">
            Picked Up ({statusCounts?.pickup_complete ?? 0})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({statusCounts?.processing ?? 0})
          </TabsTrigger>
          <TabsTrigger value="complete">
            Complete ({statusCounts?.complete ?? 0})
          </TabsTrigger>
        </TabsList>

        {["all", "pickup_scheduled", "pickup_complete", "processing", "complete"].map(
          (status) => (
            <TabsContent key={status} value={status} className="mt-4">
              <div className="rounded-md border overflow-x-auto">
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
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredJobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <p className="text-muted-foreground">No jobs found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Link
                              href={`/admin/jobs/${job.id}`}
                              className="font-mono text-sm font-medium hover:underline"
                            >
                              {job.job_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/companies/${job.company_id}`}
                              className="hover:underline"
                            >
                              {job.company_name}
                            </Link>
                          </TableCell>
                          <TableCell>{job.pickup_date ? formatDateShort(job.pickup_date) : "Not scheduled"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {job.equipment_summary || `${job.equipment_count} items`}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>{job.document_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {job.invoice_total ? (
                              <div>
                                <span className="text-xs">
                                  ${job.invoice_total.toLocaleString()}
                                </span>
                                {job.invoice_status && (
                                  <Badge
                                    variant={
                                      job.invoice_status === "paid"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      job.invoice_status === "paid"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100 ml-2"
                                        : "ml-2"
                                    }
                                  >
                                    {job.invoice_status}
                                  </Badge>
                                )}
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
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/jobs/${job.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
