import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Package, Settings, Truck, Building2 } from "lucide-react";
import { equipmentTypeOptions, type PickupRequestFormData } from "./types";

interface StepReviewProps {
  data: PickupRequestFormData;
  onChange: (data: Partial<PickupRequestFormData>) => void;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
}

export function StepReview({
  data,
  onChange,
  termsAccepted,
  onTermsChange,
}: StepReviewProps) {
  const selectedEquipment = equipmentTypeOptions.filter((eq) =>
    data.equipmentTypes.includes(eq.id)
  );

  const activeServices = [
    data.hdDestruction && `HD Destruction (${data.hdDestructionType || "TBD"})`,
    data.dataTapesDestruction && "Data Tapes Destruction",
    data.serialization && "Serialization",
    data.certificateOfDestruction && "Certificate of Destruction",
    data.certificateOfRecycling && "Certificate of Recycling",
    data.whiteGloveService && "White Glove Service",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review Your Request</h2>
        <p className="text-sm text-muted-foreground">
          Please review the details before submitting.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Location Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              {data.serviceType === "pickup" ? "Pickup Location" : "Your Location"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{data.address}</p>
            {data.buildingInfo && <p>{data.buildingInfo}</p>}
            <p>
              {data.city}, {data.state} {data.zipCode}
            </p>
            {data.poNumber && (
              <p className="mt-2">
                <span className="text-muted-foreground">PO #:</span> {data.poNumber}
              </p>
            )}
            <p className="mt-2 text-muted-foreground">
              Contact: {data.contactName}
            </p>
            {data.contactPhone && (
              <p className="text-muted-foreground">Phone: {data.contactPhone}</p>
            )}
            {data.contactEmail && (
              <p className="text-muted-foreground">Email: {data.contactEmail}</p>
            )}
            {data.accessInstructions && (
              <p className="mt-2 text-muted-foreground">
                Access: {data.accessInstructions}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Schedule Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {data.serviceType === "pickup" ? (
                <Truck className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              {data.serviceType === "pickup" ? "Pickup" : "Drop-off"} Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-muted-foreground">Service Type</p>
                <Badge variant="outline" className="capitalize">
                  {data.serviceType}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Preferred Date</p>
                <p className="font-medium">
                  {data.preferredDate
                    ? format(data.preferredDate, "PPP")
                    : "Not selected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {selectedEquipment.length > 0 ? (
              <div className="space-y-2">
                {selectedEquipment.map((eq) => (
                  <div key={eq.id} className="flex justify-between">
                    <span>{eq.label}</span>
                    <span className="font-medium">
                      {data.quantities[eq.id] || 0} units
                    </span>
                  </div>
                ))}
                {data.estimatedWeight && (
                  <p className="mt-2 text-muted-foreground">
                    Estimated weight: {data.estimatedWeight}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No equipment selected</p>
            )}
          </CardContent>
        </Card>

        {/* Services Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {activeServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeServices.map((service, index) => (
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
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
        <Textarea
          id="additionalNotes"
          value={data.additionalNotes}
          onChange={(e) => onChange({ additionalNotes: e.target.value })}
          placeholder="Any special instructions or additional information..."
          rows={3}
        />
      </div>

      {/* Terms Acknowledgment */}
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => onTermsChange(checked === true)}
        />
        <div>
          <Label htmlFor="terms" className="cursor-pointer">
            I acknowledge and agree to the pickup request terms
          </Label>
          <p className="text-sm text-muted-foreground">
            By submitting this request, you confirm that the equipment listed is
            ready for pickup and that you have authority to authorize its
            recycling and/or destruction.
          </p>
        </div>
      </div>
    </div>
  );
}
