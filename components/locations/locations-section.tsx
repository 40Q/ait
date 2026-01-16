"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Plus } from "lucide-react";
import { LocationForm } from "./location-form";
import { LocationCard } from "./location-card";
import { useLocationManager } from "./use-location-manager";

interface LocationsSectionProps {
  companyId: string;
}

export function LocationsSection({ companyId }: LocationsSectionProps) {
  const manager = useLocationManager(companyId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Saved Locations
            </CardTitle>
            <CardDescription>
              Manage pickup locations for this company
            </CardDescription>
          </div>
          <Button size="sm" onClick={manager.startAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {manager.isFormVisible && (
          <LocationForm
            data={manager.formData}
            onChange={manager.setFormData}
            onSubmit={manager.submit}
            onCancel={manager.cancel}
            isEditing={manager.isEditing}
            isLoading={manager.isSubmitting}
          />
        )}

        {manager.locations.length === 0 && !manager.isFormVisible ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No locations saved yet.
          </p>
        ) : (
          <div className="space-y-2">
            {manager.locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onEdit={() => manager.startEdit(location)}
                onDelete={() => manager.deleteLocation(location.id)}
                onSetPrimary={() => manager.setPrimary(location.id)}
                isDeleting={manager.isDeleting}
                isSettingPrimary={manager.isSettingPrimary}
                showDeleteConfirm={manager.deleteConfirmId === location.id}
                onDeleteConfirmChange={(open) =>
                  manager.setDeleteConfirmId(open ? location.id : null)
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
