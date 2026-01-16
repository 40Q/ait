"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  ClipboardList,
  FileCheck,
  Briefcase,
  Truck,
  ArrowRight,
} from "lucide-react";
import { RecentJobsList } from "./_components/recent-jobs-list";
import { PendingActions } from "./_components/pending-actions";
import {
  useJobStatusCounts,
  useRequestStatusCounts,
} from "@/lib/hooks";

export default function DashboardPage() {
  const { data: jobCounts, isLoading: loadingJobs } = useJobStatusCounts();
  const { data: requestCounts, isLoading: loadingRequests } = useRequestStatusCounts();

  const isLoading = loadingJobs || loadingRequests;

  const completedJobs = jobCounts?.complete ?? 0;
  const activeJobs =
    (jobCounts?.pickup_scheduled ?? 0) +
    (jobCounts?.pickup_complete ?? 0) +
    (jobCounts?.processing ?? 0);
  const pendingRequests = requestCounts?.pending ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your recycling activity"
      >
        <Button asChild>
          <Link href="/requests/new">
            <Truck className="mr-2 h-4 w-4" />
            Request Pickup
          </Link>
        </Button>
      </PageHeader>

      <PendingActions />

      {/* Stats Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Completed Jobs"
            value={completedJobs}
            description="All time"
            icon={FileCheck}
          />
          <StatCard
            title="Active Jobs"
            value={activeJobs}
            description="In progress"
            icon={Briefcase}
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequests}
            description="Awaiting quote"
            icon={ClipboardList}
          />
        </div>
      )}

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Jobs</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/jobs">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <RecentJobsList />
        </CardContent>
      </Card>
    </div>
  );
}
