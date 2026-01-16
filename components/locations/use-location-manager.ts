"use client";

import { useState } from "react";
import {
  useCompanyLocations,
  useCreateCompanyLocation,
  useUpdateCompanyLocation,
  useDeleteCompanyLocation,
  useSetLocationAsPrimary,
} from "@/lib/hooks";
import type { CompanyLocationInsert } from "@/lib/database/types";
import type { LocationFormData } from "./location-form";

const emptyFormData: LocationFormData = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
};

export function useLocationManager(companyId: string) {
  const { data: locations = [], isLoading } = useCompanyLocations(companyId);
  const createLocation = useCreateCompanyLocation(companyId);
  const updateLocation = useUpdateCompanyLocation(companyId);
  const deleteLocationMutation = useDeleteCompanyLocation(companyId);
  const setLocationAsPrimary = useSetLocationAsPrimary(companyId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(emptyFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setFormData(emptyFormData);
    setShowForm(false);
    setEditingId(null);
  };

  const startAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (location: typeof locations[0]) => {
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city ?? "",
      state: location.state ?? "",
      zip_code: location.zip_code ?? "",
    });
    setShowForm(false);
  };

  const submit = () => {
    if (!formData.name || !formData.address) return;

    if (editingId) {
      updateLocation.mutate(
        { id: editingId, data: formData },
        { onSuccess: resetForm }
      );
    } else {
      const data: CompanyLocationInsert = {
        company_id: companyId,
        ...formData,
        dock_type: "none",
        has_freight_elevator: false,
        has_passenger_elevator: false,
        can_use_handcarts: true,
        protective_floor_covering: false,
        is_primary: locations.length === 0,
      };
      createLocation.mutate(data, { onSuccess: resetForm });
    }
  };

  const deleteLocation = (id: string) => {
    deleteLocationMutation.mutate(id, {
      onSuccess: () => setDeleteConfirmId(null),
    });
  };

  const setPrimary = (id: string) => {
    setLocationAsPrimary.mutate(id);
  };

  return {
    // Data
    locations,
    isLoading,
    formData,
    isFormVisible: showForm || !!editingId,
    isEditing: !!editingId,
    deleteConfirmId,

    // Loading states
    isSubmitting: createLocation.isPending || updateLocation.isPending,
    isDeleting: deleteLocationMutation.isPending,
    isSettingPrimary: setLocationAsPrimary.isPending,

    // Actions
    setFormData,
    startAdd,
    startEdit,
    submit,
    cancel: resetForm,
    deleteLocation,
    setPrimary,
    setDeleteConfirmId,
  };
}
