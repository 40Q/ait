import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, type RequestStatus } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Calendar, ArrowRight } from "lucide-react";

interface Request {
  id: string;
  submittedAt: string;
  location: string;
  preferredDate: string;
  status: RequestStatus;
  equipmentSummary: string;
  quoteAmount?: number;
}

// Mock data
const requests: Request[] = [
  {
    id: "REQ-2024-0045",
    submittedAt: "Dec 15, 2024",
    location: "123 Main St, Los Angeles, CA",
    preferredDate: "Dec 20, 2024",
    status: "quote_ready",
    equipmentSummary: "15 Laptops, 8 Desktops, 20 Hard Drives",
    quoteAmount: 2450,
  },
  {
    id: "REQ-2024-0044",
    submittedAt: "Dec 12, 2024",
    location: "456 Oak Ave, San Diego, CA",
    preferredDate: "Dec 18, 2024",
    status: "pending",
    equipmentSummary: "3 Servers, 50 Hard Drives",
  },
  {
    id: "REQ-2024-0043",
    submittedAt: "Dec 8, 2024",
    location: "789 Pine Rd, San Francisco, CA",
    preferredDate: "Dec 15, 2024",
    status: "accepted",
    equipmentSummary: "25 Monitors, 10 Laptops",
    quoteAmount: 1850,
  },
  {
    id: "REQ-2024-0042",
    submittedAt: "Dec 1, 2024",
    location: "321 Elm St, Sacramento, CA",
    preferredDate: "Dec 10, 2024",
    status: "declined",
    equipmentSummary: "5 Printers",
  },
];

function RequestCard({ request }: { request: Request }) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {request.id}
              </span>
              <StatusBadge status={request.status} />
              {request.quoteAmount && request.status === "quote_ready" && (
                <Badge variant="outline" className="font-mono">
                  ${request.quoteAmount.toLocaleString()}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {request.equipmentSummary}
            </p>
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

export default function RequestsPage() {
  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    quote_ready: requests.filter((r) => r.status === "quote_ready").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    declined: requests.filter((r) => r.status === "declined").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Requests"
        description="View and manage your pickup requests"
      >
        <Button asChild>
          <Link href="/requests/new">
            <Truck className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="quoted">
            Quoted ({statusCounts.quote_ready})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({statusCounts.accepted})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {requests
            .filter((r) => r.status === "pending")
            .map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
        </TabsContent>

        <TabsContent value="quoted" className="mt-4 space-y-3">
          {requests
            .filter((r) => r.status === "quote_ready")
            .map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
        </TabsContent>

        <TabsContent value="accepted" className="mt-4 space-y-3">
          {requests
            .filter((r) => r.status === "accepted")
            .map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
