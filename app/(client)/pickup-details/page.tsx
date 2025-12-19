import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Clock, ArrowRight, Truck } from "lucide-react";

type PickupStatus = "scheduled" | "completed" | "in_transit";

interface PickupDetail {
  id: string;
  jobId: string;
  jobName: string;
  address: string;
  city: string;
  state: string;
  date: string;
  time: string;
  status: PickupStatus;
}

// Mock data
const pickupDetails: PickupDetail[] = [
  {
    id: "1",
    jobId: "W2512003",
    jobName: "Q4 Office Equipment Recycling",
    address: "123 Main Street, Suite 400",
    city: "Los Angeles",
    state: "CA",
    date: "Dec 10, 2024",
    time: "10:00 AM",
    status: "completed",
  },
  {
    id: "2",
    jobId: "W2512004",
    jobName: "Server Room Decommission",
    address: "456 Industrial Ave",
    city: "San Francisco",
    state: "CA",
    date: "Dec 18, 2024",
    time: "2:00 PM",
    status: "scheduled",
  },
  {
    id: "3",
    jobId: "W2512002",
    jobName: "Laptop Trade-in Program",
    address: "789 Tech Park Drive",
    city: "San Diego",
    state: "CA",
    date: "Dec 5, 2024",
    time: "9:00 AM",
    status: "completed",
  },
  {
    id: "4",
    jobId: "W2511002",
    jobName: "Monitor Recycling Batch",
    address: "321 Commerce Blvd",
    city: "Sacramento",
    state: "CA",
    date: "Nov 25, 2024",
    time: "11:00 AM",
    status: "completed",
  },
];

const statusConfig: Record<PickupStatus, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  in_transit: {
    label: "In Transit",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  completed: {
    label: "Completed",
    className: "border-green-200 bg-green-50 text-green-700",
  },
};

function PickupCard({ pickup }: { pickup: PickupDetail }) {
  const status = statusConfig[pickup.status];

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {pickup.jobId}
              </span>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>
            <p className="font-medium">{pickup.jobName}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {pickup.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {pickup.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {pickup.city}, {pickup.state}
              </span>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/jobs/${pickup.jobId}`}>
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PickupDetailsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Details"
        description="Track your pickup schedules and details"
      >
        <Button asChild>
          <Link href="/requests/new">
            <Truck className="mr-2 h-4 w-4" />
            Request Pickup
          </Link>
        </Button>
      </PageHeader>

      {/* Pickups List */}
      <div className="space-y-3">
        {pickupDetails.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No pickups scheduled yet</p>
              <Button asChild className="mt-4">
                <Link href="/requests/new">Request a Pickup</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          pickupDetails.map((pickup) => (
            <PickupCard key={pickup.id} pickup={pickup} />
          ))
        )}
      </div>
    </div>
  );
}
