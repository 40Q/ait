import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList,
  FileCheck,
  Briefcase,
  Receipt,
  DollarSign,
  Truck,
  ArrowRight,
} from "lucide-react";
import { RecentJobsList } from "./_components/recent-jobs-list";
import { PendingActions } from "./_components/pending-actions";

export default function DashboardPage() {
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

      {/* Pending Actions */}
      <PendingActions />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Completed Jobs"
          value={47}
          description="This year"
          icon={FileCheck}
        />
        <StatCard
          title="Active Jobs"
          value={5}
          description="In progress"
          icon={Briefcase}
        />
        <StatCard
          title="Pending Requests"
          value={2}
          description="Awaiting quote"
          icon={ClipboardList}
        />
        <StatCard
          title="Outstanding Balance"
          value="$3,240"
          description="3 unpaid invoices"
          icon={DollarSign}
        />
      </div>

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
