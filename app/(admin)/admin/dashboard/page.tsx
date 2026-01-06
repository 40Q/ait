"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Briefcase,
  ClipboardList,
  Receipt,
  FileText,
  AlertCircle,
  Clock,
  Upload,
  Plus,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileUp,
  DollarSign,
} from "lucide-react";
import type { DashboardStats, ActivityItem } from "../_types";

// Mock data
const stats: DashboardStats = {
  pendingRequests: 3,
  quotesAwaitingResponse: 2,
  jobsNeedingDocuments: 4,
  totalCompanies: 24,
  activeJobs: 12,
  completedJobsThisMonth: 38,
  outstandingInvoices: 8,
  outstandingAmount: 12450,
};

const recentActivity: ActivityItem[] = [
  {
    id: "1",
    type: "request_submitted",
    description: "New pickup request submitted",
    companyName: "Acme Corporation",
    timestamp: "10 minutes ago",
    link: "/admin/requests/REQ-2024-0048",
  },
  {
    id: "2",
    type: "quote_accepted",
    description: "Quote Q-2024-0055 accepted",
    companyName: "TechStart Inc",
    timestamp: "1 hour ago",
    link: "/admin/jobs/W2512008",
  },
  {
    id: "3",
    type: "document_uploaded",
    description: "Certificate of Destruction uploaded",
    companyName: "Global Systems",
    timestamp: "2 hours ago",
    link: "/admin/jobs/W2512005",
  },
  {
    id: "4",
    type: "invoice_synced",
    description: "Invoice INV-2024-1250 synced from QuickBooks",
    companyName: "DataFlow LLC",
    timestamp: "3 hours ago",
    link: "/admin/invoices/INV-2024-1250",
  },
  {
    id: "5",
    type: "quote_declined",
    description: "Quote Q-2024-0052 declined",
    companyName: "SmallBiz Co",
    timestamp: "5 hours ago",
    link: "/admin/quotes/Q-2024-0052",
  },
];

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "request_submitted":
      return <ClipboardList className="h-4 w-4 text-blue-500" />;
    case "quote_sent":
      return <FileText className="h-4 w-4 text-purple-500" />;
    case "quote_accepted":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "quote_declined":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "job_status_changed":
      return <Briefcase className="h-4 w-4 text-orange-500" />;
    case "document_uploaded":
      return <FileUp className="h-4 w-4 text-teal-500" />;
    case "invoice_synced":
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Manage pickup requests, quotes, jobs, and documents"
      ></PageHeader>

      {/* Pending Actions - High Priority */}
      {(stats.pendingRequests > 0 ||
        stats.quotesAwaitingResponse > 0 ||
        stats.jobsNeedingDocuments > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.pendingRequests > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium">Pending Requests</p>
                      <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/requests?status=pending">
                      View
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.quotesAwaitingResponse > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Quotes Awaiting Response</p>
                      <p className="text-2xl font-bold">{stats.quotesAwaitingResponse}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/quotes?status=sent">
                      View
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.jobsNeedingDocuments > 0 && (
            <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/20">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                      <Upload className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Jobs Needing Documents</p>
                      <p className="text-2xl font-bold">{stats.jobsNeedingDocuments}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/jobs?needsDocuments=true">
                      View
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies}
          icon={Building2}
        />
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={Briefcase}
        />
        <StatCard
          title="Completed This Month"
          value={stats.completedJobsThisMonth}
          icon={CheckCircle2}
        />
        <StatCard
          title="Outstanding Invoices"
          value={`$${stats.outstandingAmount.toLocaleString()}`}
          description={`${stats.outstandingInvoices} invoices`}
          icon={Receipt}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/companies/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Company
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/requests?status=pending">
                <ClipboardList className="mr-2 h-4 w-4" />
                View Pickup Requests
                {stats.pendingRequests > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {stats.pendingRequests}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/jobs">
                <Briefcase className="mr-2 h-4 w-4" />
                Manage Jobs
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/documents">
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/activity">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p>
                      <span className="font-medium">{activity.companyName}</span>
                      {" - "}
                      {activity.description}
                    </p>
                    <p className="text-muted-foreground">{activity.timestamp}</p>
                  </div>
                  {activity.link && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={activity.link}>View</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
