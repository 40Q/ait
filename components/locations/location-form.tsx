"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface LocationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface LocationFormProps {
  data: LocationFormData;
  onChange: (data: LocationFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
  isLoading: boolean;
}

export function LocationForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
  isLoading,
}: LocationFormProps) {
  const canSubmit = data.name && data.address;

  return (
    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
      <h4 className="font-medium">
        {isEditing ? "Edit Location" : "Add New Location"}
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="locationName">Location Name *</Label>
          <Input
            id="locationName"
            placeholder="e.g., Main Office, Warehouse"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationAddress">Street Address *</Label>
          <Input
            id="locationAddress"
            placeholder="123 Main Street"
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="locationCity">City</Label>
          <Input
            id="locationCity"
            placeholder="Los Angeles"
            value={data.city}
            onChange={(e) => onChange({ ...data, city: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationState">State</Label>
          <Input
            id="locationState"
            placeholder="CA"
            value={data.state}
            onChange={(e) => onChange({ ...data, state: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationZip">ZIP Code</Label>
          <Input
            id="locationZip"
            placeholder="90001"
            value={data.zip_code}
            onChange={(e) => onChange({ ...data, zip_code: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={onSubmit} disabled={!canSubmit || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Location" : "Save Location"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
