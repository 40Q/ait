"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MapPin, Plus, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/lib/hooks";
import { LocationForm, LocationCard, useLocationManager } from "@/components/locations";

export default function LocationsPage() {
  const { data: user } = useCurrentUser();
  const companyId = user?.company_id ?? "";
  const manager = useLocationManager(companyId);

  if (manager.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Saved Locations"
          description="Manage your pickup locations for faster request creation"
        />
        <Button onClick={manager.startAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No saved locations yet</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Add your frequently used pickup locations to speed up the request process.
            </p>
            <Button className="mt-4" onClick={manager.startAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
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
              onDeleteConfirmChange={(open) => manager.setDeleteConfirmId(open ? location.id : null)}
            />
          ))}
        </div>
      )}

      {manager.locations.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {manager.locations.length} location{manager.locations.length !== 1 ? "s" : ""} saved
        </p>
      )}
    </div>
  );
}
