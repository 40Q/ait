import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Package, Settings, Clock } from "lucide-react";

interface RequestDetailsProps {
  request: {
    id: string;
    location: {
      address: string;
      buildingInfo: string;
      city: string;
      state: string;
      zipCode: string;
      contactName: string;
      contactPhone: string;
      accessInstructions: string;
    };
    schedule: {
      preferredDate: string;
      alternateDate: string | null;
      timeWindow: string;
      urgency: string;
    };
    equipment: {
      type: string;
      quantity: number;
    }[];
    services: string[];
    additionalNotes: string;
  };
}

export function RequestDetails({ request }: RequestDetailsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Pickup Location
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{request.location.address}</p>
          {request.location.buildingInfo && (
            <p>{request.location.buildingInfo}</p>
          )}
          <p>
            {request.location.city}, {request.location.state}{" "}
            {request.location.zipCode}
          </p>
          <div className="mt-3 border-t pt-3">
            <p className="text-muted-foreground">Contact</p>
            <p className="font-medium">{request.location.contactName}</p>
            <p className="text-muted-foreground">
              {request.location.contactPhone}
            </p>
          </div>
          {request.location.accessInstructions && (
            <div className="mt-3 border-t pt-3">
              <p className="text-muted-foreground">Access Instructions</p>
              <p>{request.location.accessInstructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground">Preferred Date</p>
              <p className="font-medium">{request.schedule.preferredDate}</p>
            </div>
            {request.schedule.alternateDate && (
              <div>
                <p className="text-muted-foreground">Alternate Date</p>
                <p className="font-medium">{request.schedule.alternateDate}</p>
              </div>
            )}
            <div className="flex gap-4">
              <div>
                <p className="text-muted-foreground">Time Window</p>
                <p className="font-medium capitalize">
                  {request.schedule.timeWindow}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Urgency</p>
                <Badge
                  variant={
                    request.schedule.urgency === "rush"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {request.schedule.urgency}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Equipment
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="space-y-2">
            {request.equipment.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.type}</span>
                <span className="font-medium">{item.quantity} units</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Services Requested
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {request.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {request.services.map((service, index) => (
                <Badge key={index} variant="outline">
                  {service}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No additional services</p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {request.additionalNotes && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{request.additionalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
