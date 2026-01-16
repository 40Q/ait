import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Building2, Truck, FileText, MapPin, Star } from "lucide-react";
import { useCurrentUser, useCompanyLocations, useCompanyLocation } from "@/lib/hooks";
import type { PickupRequestFormData, PrePickupCallPreference, DockType, TruckSize } from "./types";
import { prePickupCallOptions, dockTypeOptions, truckSizeOptions } from "./types";

interface StepLocationProps {
  data: PickupRequestFormData;
  onChange: (data: Partial<PickupRequestFormData>) => void;
}

const usStates = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export function StepLocation({ data, onChange }: StepLocationProps) {
  const { data: user } = useCurrentUser();
  const { data: savedLocations = [] } = useCompanyLocations(user?.company_id ?? "");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Determine if we should show the "save location" checkbox:
  // - Show when there are no saved locations (user is entering manually)
  // - Show when user explicitly selected "manual" from the dropdown
  // - Hide when user selected an existing saved location
  const showSaveLocationCheckbox = savedLocations.length === 0 || selectedLocationId === "manual";

  const handleSelectSavedLocation = (locationId: string) => {
    setSelectedLocationId(locationId);
    if (locationId === "manual") {
      // Clear form for manual entry
      onChange({
        locationName: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        buildingInfo: "",
        equipmentLocation: "",
        dockType: "none",
        dockHoursStart: "",
        dockHoursEnd: "",
        hasFreightElevator: false,
        hasPassengerElevator: false,
        elevatorRestrictions: "",
        canUseHandcarts: true,
        protectiveFloorCovering: false,
        maxTruckSize: "",
      });
      return;
    }

    const location = savedLocations.find((l) => l.id === locationId);
    if (location) {
      onChange({
        locationName: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zip_code,
        saveLocationForFuture: false, // Reset since this is already a saved location
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pickup Location</h2>
        <p className="text-sm text-muted-foreground">
          Where should we pick up the equipment?
        </p>
      </div>

      {/* Saved Locations Dropdown */}
      {savedLocations.length > 0 && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select a Saved Location
              </Label>
              <Select onValueChange={handleSelectSavedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose from your saved locations or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    <span className="text-muted-foreground">Enter new location manually</span>
                  </SelectItem>
                  {savedLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        {location.is_primary && (
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                        )}
                        <span className="font-medium">{location.name}</span>
                        <span className="text-muted-foreground">
                          - {location.address}, {location.city}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a saved location to auto-fill the form, or enter a new address below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="locationName">Location Name</Label>
          <Input
            id="locationName"
            value={data.locationName}
            onChange={(e) => onChange({ locationName: e.target.value })}
            placeholder="e.g., Data Center, Warehouse B"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Los Angeles"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select
              value={data.state}
              onValueChange={(value) => onChange({ state: value })}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {usStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={data.zipCode}
              onChange={(e) => onChange({ zipCode: e.target.value })}
              placeholder="90001"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buildingInfo">Building / Suite / Floor</Label>
          <Input
            id="buildingInfo"
            value={data.buildingInfo}
            onChange={(e) => onChange({ buildingInfo: e.target.value })}
            placeholder="Suite 400, 4th Floor"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipmentLocation">Where in the building is the equipment located?</Label>
          <Input
            id="equipmentLocation"
            value={data.equipmentLocation}
            onChange={(e) => onChange({ equipmentLocation: e.target.value })}
            placeholder="e.g., telco closet, warehouse, various offices on 3rd floor"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="poNumber">PO # / Customer Reference (Optional)</Label>
          <Input
            id="poNumber"
            value={data.poNumber}
            onChange={(e) => onChange({ poNumber: e.target.value })}
            placeholder="PO-12345"
          />
        </div>

        {/* Save Location Checkbox - show when entering a new location manually */}
        {showSaveLocationCheckbox && data.address && (
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
            <Checkbox
              id="saveLocationForFuture"
              checked={data.saveLocationForFuture}
              onCheckedChange={(checked) =>
                onChange({ saveLocationForFuture: checked === true })
              }
            />
            <div>
              <Label htmlFor="saveLocationForFuture" className="cursor-pointer">
                Save this location for future requests
              </Label>
              <p className="text-xs text-muted-foreground">
                This address will be saved to your locations list for quick selection next time
              </p>
            </div>
          </div>
        )}
      </div>

      {/* On-Site Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            On-Site Contact *
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This person will meet our team on the day of services and provide building access.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="onSiteContactName">Contact Name</Label>
              <Input
                id="onSiteContactName"
                value={data.onSiteContactName}
                onChange={(e) => onChange({ onSiteContactName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onSiteContactPhone">Contact Phone</Label>
              <Input
                id="onSiteContactPhone"
                type="tel"
                value={data.onSiteContactPhone}
                onChange={(e) => onChange({ onSiteContactPhone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="onSiteContactEmail">Contact Email</Label>
            <Input
              id="onSiteContactEmail"
              type="email"
              value={data.onSiteContactEmail}
              onChange={(e) => onChange({ onSiteContactEmail: e.target.value })}
              placeholder="john.smith@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Pre-pickup call preference</Label>
            <Select
              value={data.prePickupCall}
              onValueChange={(value: PrePickupCallPreference) => onChange({ prePickupCall: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                {prePickupCallOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Payable Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Accounts Payable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="accountsPayableEmail">Accounts Payable Contact Email</Label>
            <Input
              id="accountsPayableEmail"
              type="email"
              value={data.accountsPayableEmail}
              onChange={(e) => onChange({ accountsPayableEmail: e.target.value })}
              placeholder="ap@company.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Facility Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Facility Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dock */}
          <div className="space-y-3">
            <Label>Dock Availability</Label>
            <Select
              value={data.dockType}
              onValueChange={(value: DockType) => onChange({ dockType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dock type" />
              </SelectTrigger>
              <SelectContent>
                {dockTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {data.dockType !== "none" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dockHoursStart">Dock Hours Start</Label>
                  <Input
                    id="dockHoursStart"
                    type="time"
                    value={data.dockHoursStart}
                    onChange={(e) => onChange({ dockHoursStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dockHoursEnd">Dock Hours End</Label>
                  <Input
                    id="dockHoursEnd"
                    type="time"
                    value={data.dockHoursEnd}
                    onChange={(e) => onChange({ dockHoursEnd: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dockTimeLimit">Time Limit (if any)</Label>
                  <Input
                    id="dockTimeLimit"
                    value={data.dockTimeLimit}
                    onChange={(e) => onChange({ dockTimeLimit: e.target.value })}
                    placeholder="e.g., 2 hours max"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Elevators */}
          <div className="space-y-3">
            <Label>Elevator Access</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="hasFreightElevator"
                  checked={data.hasFreightElevator}
                  onCheckedChange={(checked) =>
                    onChange({ hasFreightElevator: checked === true })
                  }
                />
                <Label htmlFor="hasFreightElevator" className="cursor-pointer font-normal">
                  Freight elevator available
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="hasPassengerElevator"
                  checked={data.hasPassengerElevator}
                  onCheckedChange={(checked) =>
                    onChange({ hasPassengerElevator: checked === true })
                  }
                />
                <Label htmlFor="hasPassengerElevator" className="cursor-pointer font-normal">
                  Passenger elevator available
                </Label>
              </div>
            </div>
            {(data.hasFreightElevator || data.hasPassengerElevator) && (
              <div className="space-y-2">
                <Label htmlFor="elevatorRestrictions">Elevator Restrictions (if any)</Label>
                <Input
                  id="elevatorRestrictions"
                  value={data.elevatorRestrictions}
                  onChange={(e) => onChange({ elevatorRestrictions: e.target.value })}
                  placeholder="e.g., time limits, padding required"
                />
              </div>
            )}
          </div>

          {/* Other Access */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="canUseHandcarts"
                checked={data.canUseHandcarts}
                onCheckedChange={(checked) =>
                  onChange({ canUseHandcarts: checked === true })
                }
              />
              <Label htmlFor="canUseHandcarts" className="cursor-pointer font-normal">
                Handcarts/pallet jacks can be used within the building
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="protectiveFloorCovering"
                checked={data.protectiveFloorCovering}
                onCheckedChange={(checked) =>
                  onChange({ protectiveFloorCovering: checked === true })
                }
              />
              <div>
                <Label htmlFor="protectiveFloorCovering" className="cursor-pointer font-normal">
                  Protective floor covering required
                </Label>
              </div>
            </div>
            {data.protectiveFloorCovering && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="protectiveFloorCoveringDetails">Coverage details</Label>
                <Input
                  id="protectiveFloorCoveringDetails"
                  value={data.protectiveFloorCoveringDetails}
                  onChange={(e) => onChange({ protectiveFloorCoveringDetails: e.target.value })}
                  placeholder="e.g., 50 feet from equipment to door"
                />
              </div>
            )}
          </div>

          {/* Max Truck Size */}
          <div className="space-y-2">
            <Label>Maximum truck size this location can accommodate</Label>
            <Select
              value={data.maxTruckSize}
              onValueChange={(value: TruckSize | "") => onChange({ maxTruckSize: value as TruckSize })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select truck size" />
              </SelectTrigger>
              <SelectContent>
                {truckSizeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* COI Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" />
            Certificate of Insurance (COI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="coiRequired"
              checked={data.coiRequired}
              onCheckedChange={(checked) =>
                onChange({ coiRequired: checked === true })
              }
            />
            <div>
              <Label htmlFor="coiRequired" className="cursor-pointer">
                A Certificate of Insurance (COI) is required for services at this property
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                If required, please upload your sample COI document. We will generate and provide a COI for you.
              </p>
            </div>
          </div>
          {data.coiRequired && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="coiUpload">Upload Sample COI</Label>
              <Input
                id="coiUpload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onChange({ coiSampleFile: file });
                  }
                }}
                className="cursor-pointer"
              />
              {data.coiSampleFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {data.coiSampleFile.name}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Instructions */}
      <div className="space-y-2">
        <Label htmlFor="accessInstructions">Special Instructions / Access Notes</Label>
        <Textarea
          id="accessInstructions"
          value={data.accessInstructions}
          onChange={(e) => onChange({ accessInstructions: e.target.value })}
          placeholder="Loading dock on the east side. Check in with security at front desk. Driver requirements, etc."
          rows={3}
        />
      </div>
    </div>
  );
}
