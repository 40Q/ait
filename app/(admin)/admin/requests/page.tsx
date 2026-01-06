"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type RequestStatus } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  HardDrive,
  FileText,
  Package,
  Sparkles,
} from "lucide-react";

interface AdminRequestListItem {
  id: string;
  companyId: string;
  companyName: string;
  submittedAt: string;
  preferredDate: string;
  location: string;
  equipmentSummary: string;
  status: RequestStatus;
  hasDataDestruction: boolean;
  hasSerialization: boolean;
  hasWhiteGlove: boolean;
  quoteAmount?: number;
}

// Mock data
const requests: AdminRequestListItem[] = [
  {
    id: "REQ-2024-0048",
    companyId: "1",
    companyName: "Acme Corporation",
    submittedAt: "Dec 18, 2024 at 9:15 AM",
    preferredDate: "Dec 22, 2024",
    location: "123 Main St, Los Angeles, CA",
    equipmentSummary: "25 Laptops, 10 Desktops, 50 Hard Drives",
    status: "pending",
    hasDataDestruction: true,
    hasSerialization: true,
    hasWhiteGlove: false,
  },
  {
    id: "REQ-2024-0047",
    companyId: "2",
    companyName: "TechStart Inc",
    submittedAt: "Dec 17, 2024 at 3:30 PM",
    preferredDate: "Dec 20, 2024",
    location: "456 Oak Ave, San Diego, CA",
    equipmentSummary: "5 Servers, 100 Hard Drives",
    status: "pending",
    hasDataDestruction: true,
    hasSerialization: true,
    hasWhiteGlove: true,
  },
  {
    id: "REQ-2024-0046",
    companyId: "3",
    companyName: "Global Systems",
    submittedAt: "Dec 16, 2024 at 11:00 AM",
    preferredDate: "Dec 19, 2024",
    location: "789 Pine Rd, San Francisco, CA",
    equipmentSummary: "15 Monitors, 8 Printers",
    status: "pending",
    hasDataDestruction: false,
    hasSerialization: false,
    hasWhiteGlove: false,
  },
  {
    id: "REQ-2024-0045",
    companyId: "1",
    companyName: "Acme Corporation",
    submittedAt: "Dec 15, 2024 at 10:30 AM",
    preferredDate: "Dec 20, 2024",
    location: "123 Main St, Los Angeles, CA",
    equipmentSummary: "15 Laptops, 8 Desktops, 20 Hard Drives",
    status: "quote_ready",
    hasDataDestruction: true,
    hasSerialization: false,
    hasWhiteGlove: false,
    quoteAmount: 2450,
  },
  {
    id: "REQ-2024-0044",
    companyId: "4",
    companyName: "DataFlow LLC",
    submittedAt: "Dec 12, 2024 at 2:15 PM",
    preferredDate: "Dec 18, 2024",
    location: "321 Elm St, Sacramento, CA",
    equipmentSummary: "3 Servers, 50 Hard Drives",
    status: "accepted",
    hasDataDestruction: true,
    hasSerialization: true,
    hasWhiteGlove: false,
    quoteAmount: 1850,
  },
  {
    id: "REQ-2024-0043",
    companyId: "5",
    companyName: "SmallBiz Co",
    submittedAt: "Dec 10, 2024 at 9:00 AM",
    preferredDate: "Dec 15, 2024",
    location: "555 Maple Dr, Fresno, CA",
    equipmentSummary: "5 Laptops, 2 Printers",
    status: "declined",
    hasDataDestruction: false,
    hasSerialization: false,
    hasWhiteGlove: false,
  },
];

function RequestCard({ request }: { request: AdminRequestListItem }) {
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
                {request.id}
              </Link>
              <StatusBadge status={request.status} />
              {request.quoteAmount && (
                <Badge variant="outline" className="font-mono">
                  ${request.quoteAmount.toLocaleString()}
                </Badge>
              )}
            </div>

            <div>
              <Link
                href={`/admin/companies/${request.companyId}`}
                className="font-medium hover:underline"
              >
                {request.companyName}
              </Link>
              <p className="text-sm text-muted-foreground">
                {request.equipmentSummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {request.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Requested: {request.preferredDate}
              </span>
            </div>

            {/* Service Icons */}
            <div className="flex gap-2">
              {request.hasDataDestruction && (
                <Badge variant="secondary" className="gap-1">
                  <HardDrive className="h-3 w-3" />
                  Data Destruction
                </Badge>
              )}
              {request.hasSerialization && (
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Serialization
                </Badge>
              )}
              {request.hasWhiteGlove && (
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
  const [companyFilter, setCompanyFilter] = useState("all");

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    quote_ready: requests.filter((r) => r.status === "quote_ready").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    declined: requests.filter((r) => r.status === "declined").length,
  };

  const filterRequests = (status: string) => {
    let filtered = requests;

    if (status !== "all") {
      filtered = filtered.filter((r) => r.status === status);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.id.toLowerCase().includes(query) ||
          r.companyName.toLowerCase().includes(query)
      );
    }

    if (companyFilter !== "all") {
      filtered = filtered.filter((r) => r.companyId === companyFilter);
    }

    return filtered;
  };

  // Get unique companies for filter
  const companies = Array.from(
    new Map(requests.map((r) => [r.companyId, r.companyName])).entries()
  );

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
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[200px]">
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="quote_ready">
            Quoted ({statusCounts.quote_ready})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({statusCounts.accepted})
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined ({statusCounts.declined})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "quote_ready", "accepted", "declined"].map(
          (status) => (
            <TabsContent key={status} value={status} className="mt-4 space-y-3">
              {filterRequests(status).map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {filterRequests(status).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No requests found</p>
                </div>
              )}
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
