"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import {
  Building2,
  Briefcase,
  ClipboardList,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useRequestStatusCounts,
  useQuoteStatusCounts,
  useJobStatusCounts,
  useCompanyList,
  useRequestList,
} from "@/lib/hooks";
import { formatDateTimeShort } from "@/lib/utils/date";

export default function AdminDashboardPage() {
  const { data: requestCounts, isLoading: loadingRequests } = useRequestStatusCounts();
  const { data: quoteCounts, isLoading: loadingQuotes } = useQuoteStatusCounts();
  const { data: jobCounts, isLoading: loadingJobs } = useJobStatusCounts();
  const { data: companies = [], isLoading: loadingCompanies } = useCompanyList();
  const { data: recentRequests = [] } = useRequestList();

  const isLoading = loadingRequests || loadingQuotes || loadingJobs || loadingCompanies;

  const pendingRequests = requestCounts?.pending ?? 0;
  const quotesAwaitingResponse = quoteCounts?.sent ?? 0;
  const totalCompanies = companies.length;
  const activeJobs =
    (jobCounts?.pickup_scheduled ?? 0) +
    (jobCounts?.pickup_complete ?? 0) +
    (jobCounts?.processing ?? 0);
  const completedJobs = jobCounts?.complete ?? 0;

  const hasPendingActions = pendingRequests > 0 || quotesAwaitingResponse > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Manage pickup requests, quotes, jobs, and documents"
      />

      {/* Pending Actions */}
      {hasPendingActions && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingRequests > 0 && (
            <PendingActionCard
              title="Pending Requests"
              count={pendingRequests}
              href="/admin/requests"
              icon={AlertCircle}
              variant="orange"
            />
          )}
          {quotesAwaitingResponse > 0 && (
            <PendingActionCard
              title="Quotes Awaiting Response"
              count={quotesAwaitingResponse}
              href="/admin/quotes"
              icon={Clock}
              variant="blue"
            />
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Companies" value={totalCompanies} icon={Building2} />
        <StatCard title="Active Jobs" value={activeJobs} icon={Briefcase} />
        <StatCard title="Completed Jobs" value={completedJobs} icon={CheckCircle2} />
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Requests</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/requests">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent requests
            </p>
          ) : (
            <div className="space-y-4">
              {recentRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-start gap-3 text-sm">
                  <ClipboardList className="h-4 w-4 mt-0.5 text-blue-500" />
                  <div className="flex-1 space-y-1">
                    <p>
                      <span className="font-medium">{request.company_name}</span>
                      {" - "}
                      {request.equipment_summary || `${request.equipment_count} items`}
                    </p>
                    <p className="text-muted-foreground">
                      {formatDateTimeShort(request.created_at)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/requests/${request.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type PendingActionVariant = "orange" | "blue" | "red";

const variantStyles: Record<PendingActionVariant, { card: string; icon: string }> = {
  orange: {
    card: "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20",
    icon: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
  },
  blue: {
    card: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20",
    icon: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  },
  red: {
    card: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20",
    icon: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
  },
};

function PendingActionCard({
  title,
  count,
  href,
  icon: Icon,
  variant,
}: {
  title: string;
  count: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: PendingActionVariant;
}) {
  const styles = variantStyles[variant];

  return (
    <Card className={styles.card}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${styles.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={href}>
              View
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
