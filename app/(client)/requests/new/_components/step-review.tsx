import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Package,
  Settings,
  Truck,
  Building2,
  User,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { parseApEmails } from "@/lib/utils/ap-emails";
import {
  equipmentTypeOptions,
  dataDestructionOptions,
  packingServiceOptions,
  dockTypeOptions,
  truckSizeOptions,
  prePickupCallOptions,
  type PickupRequestFormData,
} from "./types";

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

  const selectedDataDestruction = dataDestructionOptions.find(
    (opt) => opt.value === data.dataDestructionService
  );

  const selectedPacking = packingServiceOptions.find(
    (opt) => opt.value === data.packingService
  );

  const selectedDock = dockTypeOptions.find(
    (opt) => opt.value === data.dockType
  );

  const selectedTruck = truckSizeOptions.find(
    (opt) => opt.value === data.maxTruckSize
  );

  const selectedPrePickupCall = prePickupCallOptions.find(
    (opt) => opt.value === data.prePickupCall
  );

  const activeServices = [
    data.dataDestructionService !== "none" && selectedDataDestruction?.label,
    data.packingService !== "none" && selectedPacking?.label,
    data.whiteGloveService && "White Glove Services",
  ].filter(Boolean);

  const importantFlags = [
    data.hasHeavyEquipment && "Heavy equipment requiring special handling",
    data.hasHazmatOrBatteries && "Contains batteries or hazmat materials",
    data.coiRequired && "COI required",
    data.protectiveFloorCovering && "Protective floor covering required",
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              {data.serviceType === "pickup" ? "Pickup Location" : "Your Location"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {data.locationName && (
              <p className="font-medium">{data.locationName}</p>
            )}
            <div>
              <p>{data.address}</p>
              {data.buildingInfo && <p>{data.buildingInfo}</p>}
              <p>
                {data.city}, {data.state} {data.zipCode}
              </p>
            </div>
            {data.equipmentLocation && (
              <p className="text-muted-foreground">
                <span className="font-medium">Equipment location:</span> {data.equipmentLocation}
              </p>
            )}
            {data.poNumber && (
              <p>
                <span className="text-muted-foreground">PO #:</span> {data.poNumber}
              </p>
            )}

            {/* Facility Info */}
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedDock && data.dockType !== "none" && (
                <Badge variant="outline">
                  {selectedDock.label}
                  {data.dockHoursStart && data.dockHoursEnd && (
                    <span className="ml-1">({data.dockHoursStart} - {data.dockHoursEnd})</span>
                  )}
                </Badge>
              )}
              {data.hasFreightElevator && (
                <Badge variant="outline">Freight Elevator</Badge>
              )}
              {data.hasPassengerElevator && (
                <Badge variant="outline">Passenger Elevator</Badge>
              )}
              {selectedTruck && (
                <Badge variant="outline">Max: {selectedTruck.label}</Badge>
              )}
            </div>

            {data.accessInstructions && (
              <p className="text-muted-foreground pt-2">
                <span className="font-medium">Access:</span> {data.accessInstructions}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contacts Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                On-Site Contact
              </p>
              <p className="font-medium">{data.onSiteContactName || "Not provided"}</p>
              {data.onSiteContactPhone && <p>{data.onSiteContactPhone}</p>}
              {data.onSiteContactEmail && <p>{data.onSiteContactEmail}</p>}
              {selectedPrePickupCall && data.prePickupCall !== "none" && (
                <p className="text-muted-foreground mt-1">{selectedPrePickupCall.label}</p>
              )}
            </div>
            {data.accountsPayableEmail && (
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Accounts Payable
                </p>
                {parseApEmails(data.accountsPayableEmail).map((email, i) => (
                  <p key={i}>{email}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Summary */}
        <Card>
          <CardHeader>
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
                    ? formatDate(data.preferredDate)
                    : "Not selected"}
                  {data.preferredDateRangeEnd && (
                    <span> - {formatDate(data.preferredDateRangeEnd)}</span>
                  )}
                </p>
              </div>
            </div>
            {data.unavailableDates && (
              <p className="mt-2 text-muted-foreground">
                <span className="font-medium">Not available:</span> {data.unavailableDates}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Equipment Summary */}
        <Card>
          <CardHeader>
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

            {data.equipmentUnpluggedConfirmed && (
              <div className="flex items-center gap-2 mt-3 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Equipment will be unplugged and powered down</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Flags */}
        {importantFlags.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1">
                {importantFlags.map((flag, index) => (
                  <li key={index} className="text-yellow-800">
                    {flag}
                  </li>
                ))}
              </ul>
              {data.coiRequired && data.coiSampleFile && (
                <p className="mt-2 text-yellow-700">
                  Sample COI uploaded: {data.coiSampleFile.name}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Services Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {activeServices.length > 0 ? (
              <div className="space-y-2">
                {activeServices.map((service, index) => (
                  <Badge key={index} variant="outline" className="mr-2">
                    {service}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No additional services selected</p>
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
