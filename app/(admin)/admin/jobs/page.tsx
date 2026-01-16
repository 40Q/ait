"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { ListFilters } from "@/components/ui/list-filters";
import { Loader2, Eye, FileText, Plus } from "lucide-react";
import { useJobList, useJobStatusCounts, useRealtimeJobs, useListPage, useTabFilter } from "@/lib/hooks";
import { formatDateShort } from "@/lib/utils/date";
import type { JobStatus } from "@/lib/database/types";

const invoiceFilterOptions = [
  { value: "all", label: "All Invoices" },
  { value: "invoiced", label: "Invoiced" },
  { value: "not_invoiced", label: "Not Invoiced" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

export default function AdminJobsPage() {
  const { searchQuery, setSearchQuery, filters: pageFilters, setFilter } = useListPage<{
    invoice: string;
  }>({
    defaultFilters: { invoice: "all" },
  });
  const { activeTab, setActiveTab } = useTabFilter("all");

  // Enable real-time updates
  useRealtimeJobs();

  // Fetch jobs with filters (search is handled by the database)
  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    status: activeTab !== "all" ? (activeTab as JobStatus) : undefined,
  }), [searchQuery, activeTab]);

  const { data: jobs = [], isLoading, error } = useJobList(filters);
  const { data: statusCounts } = useJobStatusCounts();

  // Client-side filtering for invoice status only
  const filteredJobs = useMemo(() => {
    let result = jobs;
    const invoiceFilter = pageFilters.invoice;

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
  }, [jobs, pageFilters.invoice]);

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
      >
        <Button asChild>
          <Link href="/admin/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Link>
        </Button>
      </PageHeader>

      <ListFilters
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by Job ID or company..."
        filters={[
          {
            value: pageFilters.invoice,
            onChange: (value) => setFilter("invoice", value),
            options: invoiceFilterOptions,
            className: "w-[180px]",
          },
        ]}
      />

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
