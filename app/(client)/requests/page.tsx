"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Truck,
  MapPin,
  Calendar,
  ArrowRight,
  ChevronDown,
  Recycle,
  Box,
  Loader2,
} from "lucide-react";
import { isCyrusOneUser } from "@/lib/user";
import { useRequestList, useRequestStatusCounts } from "@/lib/hooks";
import type { RequestListItem, RequestStatus } from "@/lib/database/types";

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not specified";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RequestCard({ request }: { request: RequestListItem }) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {request.request_number}
              </span>
              <StatusBadge status={request.status} />
              {request.quote_total && request.status === "quote_ready" && (
                <Badge variant="outline" className="font-mono">
                  ${request.quote_total.toLocaleString()}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {request.equipment_summary || `${request.equipment_count} items`}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {request.location_summary}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Requested: {formatDate(request.preferred_date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {request.status === "quote_ready" && (
              <Button size="sm" asChild>
                <Link href={`/requests/${request.id}`}>
                  Review Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {request.status !== "quote_ready" && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/requests/${request.id}`}>View Details</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewRequestButton() {
  const isCyrusOne = isCyrusOneUser();

  if (!isCyrusOne) {
    return (
      <Button asChild>
        <Link href="/requests/new">
          <Truck className="mr-2 h-4 w-4" />
          New Request
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Truck className="mr-2 h-4 w-4" />
          New Request
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Standard Forms</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/requests/new" className="cursor-pointer">
            <Truck className="mr-2 h-4 w-4" />
            Pickup Request
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Additional Forms</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/requests/forms/materials" className="cursor-pointer">
            <Recycle className="mr-2 h-4 w-4" />
            Materials Pickup
            <span className="ml-auto text-xs text-muted-foreground">
              Wood/Metal/E-Waste
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/requests/forms/logistics" className="cursor-pointer">
            <Box className="mr-2 h-4 w-4" />
            Logistics Request
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filters = useMemo(
    () => ({
      status: activeTab !== "all" ? (activeTab as RequestStatus) : undefined,
    }),
    [activeTab]
  );

  const { data: requests = [], isLoading } = useRequestList(filters);
  const { data: statusCounts } = useRequestStatusCounts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Requests"
        description="View and manage your pickup requests"
      >
        <NewRequestButton />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts?.all ?? 0})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts?.pending ?? 0})
          </TabsTrigger>
          <TabsTrigger value="quote_ready">
            Quoted ({statusCounts?.quote_ready ?? 0})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({statusCounts?.accepted ?? 0})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "quote_ready", "accepted"].map((status) => (
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
        ))}
      </Tabs>
    </div>
  );
}
