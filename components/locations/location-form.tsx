"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useFormValidation } from "@/lib/hooks/use-form-validation";
import { locationFormSchema, type LocationFormInput } from "@/lib/validation";

export type LocationFormData = LocationFormInput;

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
  const { errors, validate, clearFieldError } = useFormValidation<LocationFormData>(locationFormSchema);

  const handleChange = (newData: LocationFormData) => {
    const changedKeys = Object.keys(newData).filter(
      (key) => newData[key as keyof LocationFormData] !== data[key as keyof LocationFormData]
    );
    changedKeys.forEach((key) => clearFieldError(key as keyof LocationFormData));
    onChange(newData);
  };

  const handleSubmit = () => {
    const result = validate(data);
    if (!result.success) {
      return;
    }
    onSubmit();
  };

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
            onChange={(e) => handleChange({ ...data, name: e.target.value })}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationAddress">Street Address *</Label>
          <Input
            id="locationAddress"
            placeholder="123 Main Street"
            value={data.address}
            onChange={(e) => handleChange({ ...data, address: e.target.value })}
            aria-invalid={!!errors.address}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="locationCity">City</Label>
          <Input
            id="locationCity"
            placeholder="Los Angeles"
            value={data.city}
            onChange={(e) => handleChange({ ...data, city: e.target.value })}
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationState">State</Label>
          <Input
            id="locationState"
            placeholder="CA"
            value={data.state}
            onChange={(e) => handleChange({ ...data, state: e.target.value })}
            aria-invalid={!!errors.state}
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationZip">ZIP Code</Label>
          <Input
            id="locationZip"
            placeholder="90001"
            value={data.zip_code}
            onChange={(e) => handleChange({ ...data, zip_code: e.target.value })}
            aria-invalid={!!errors.zip_code}
          />
          {errors.zip_code && (
            <p className="text-sm text-destructive">{errors.zip_code}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={isLoading}>
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
