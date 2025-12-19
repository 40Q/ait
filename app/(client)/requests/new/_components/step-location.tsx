import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PickupRequestFormData } from "./types";

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pickup Location</h2>
        <p className="text-sm text-muted-foreground">
          Where should we pick up the equipment?
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
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
          <Label htmlFor="poNumber">PO # / Customer Reference (Optional)</Label>
          <Input
            id="poNumber"
            value={data.poNumber}
            onChange={(e) => onChange({ poNumber: e.target.value })}
            placeholder="PO-12345"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={data.contactName}
              onChange={(e) => onChange({ contactName: e.target.value })}
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={data.contactPhone}
              onChange={(e) => onChange({ contactPhone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={data.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            placeholder="john.smith@company.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessInstructions">Access Instructions</Label>
          <Textarea
            id="accessInstructions"
            value={data.accessInstructions}
            onChange={(e) => onChange({ accessInstructions: e.target.value })}
            placeholder="Loading dock on the east side. Check in with security at front desk."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
