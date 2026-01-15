"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  HardDrive,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useRequestList, useRequestStatusCounts } from "@/lib/hooks";
import { formatDate } from "@/lib/utils/date";
import type { RequestListItem, RequestStatus } from "@/lib/database/types";

function RequestCard({ request }: { request: RequestListItem }) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/requests/${request.id}`}
                className="font-mono text-sm font-medium hover:underline"
              >
                {request.request_number}
              </Link>
              <StatusBadge status={request.status} />
              {request.form_type !== "standard" && (
                <Badge variant="outline" className="capitalize">
                  {request.form_type}
                </Badge>
              )}
              {request.quote_total && (
                <Badge variant="outline" className="font-mono">
                  ${request.quote_total.toLocaleString()}
                </Badge>
              )}
            </div>

            <div>
              <Link
                href={`/admin/companies/${request.company_id}`}
                className="font-medium hover:underline"
              >
                {request.company_name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {request.equipment_summary || `${request.equipment_count} items`}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {request.location_summary}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Requested: {formatDate(request.preferred_date) || "Not specified"}
              </span>
            </div>

            {/* Service Icons */}
            <div className="flex gap-2">
              {request.has_data_destruction && (
                <Badge variant="secondary" className="gap-1">
                  <HardDrive className="h-3 w-3" />
                  Data Destruction
                </Badge>
              )}
              {request.has_serialization && (
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Serialization
                </Badge>
              )}
              {request.has_white_glove && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  White Glove
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {request.status === "pending" && (
              <Button size="sm" asChild>
                <Link href={`/admin/quotes/new?request=${request.id}`}>
                  Create Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/requests/${request.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminRequestsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch requests with filters (search is handled by the database)
  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    status: activeTab !== "all" ? (activeTab as RequestStatus) : undefined,
  }), [searchQuery, activeTab]);

  const { data: requests = [], isLoading, error } = useRequestList(filters);
  const { data: statusCounts } = useRequestStatusCounts();

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load requests: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Requests"
        description="Review and manage pickup requests from clients"
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({statusCounts?.all ?? 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts?.pending ?? 0})
          </TabsTrigger>
          <TabsTrigger value="quote_ready">
            Quoted ({statusCounts?.quote_ready ?? 0})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({statusCounts?.accepted ?? 0})
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined ({statusCounts?.declined ?? 0})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "quote_ready", "accepted", "declined"].map(
          (status) => (
            <TabsContent key={status} value={status} className="mt-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No requests found</p>
                </div>
              ) : (
                requests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
