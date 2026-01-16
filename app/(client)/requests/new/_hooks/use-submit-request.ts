"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, uploadFiles, STORAGE_BUCKETS } from "@/lib/storage/upload";
import { useCreateRequest, useCurrentUser, useCreateCompanyLocation } from "@/lib/hooks";
import { mapFormDataToRequestInsert, type PickupRequestFormData } from "../_components/types";
import type { CompanyLocationInsert } from "@/lib/database/types";

interface UseSubmitRequestReturn {
  submit: (formData: PickupRequestFormData) => Promise<void>;
  isUploading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export function useSubmitRequest(): UseSubmitRequestReturn {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const createRequest = useCreateRequest();
  const createLocation = useCreateCompanyLocation(currentUser?.company_id ?? "");

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (formData: PickupRequestFormData) => {
    if (!currentUser?.company_id) {
      setError("Unable to submit: No company associated with your account");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const supabase = createClient();
      const folder = currentUser.company_id;
      let updatedFormData = { ...formData };

      // Upload COI sample file if provided
      if (formData.coiSampleFile) {
        const result = await uploadFile(supabase, formData.coiSampleFile, {
          bucket: STORAGE_BUCKETS.REQUEST_FILES,
          folder,
          fileName: "coi-sample",
        });
        updatedFormData.coiSamplePath = result.path;
      }

      // Upload equipment files if provided
      if (formData.equipmentFiles.length > 0) {
        const results = await uploadFiles(supabase, formData.equipmentFiles, {
          bucket: STORAGE_BUCKETS.REQUEST_FILES,
          folder,
        });
        updatedFormData.equipmentFilePaths = results.map((r) => r.path);
      }

      setIsUploading(false);

      // Save location for future use if requested
      if (formData.saveLocationForFuture && formData.address) {
        const locationData: CompanyLocationInsert = {
          company_id: currentUser.company_id,
          name: formData.locationName || formData.address, // Use address as fallback name
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          building_info: formData.buildingInfo || null,
          equipment_location: formData.equipmentLocation || null,
          access_instructions: formData.accessInstructions || null,
          dock_type: formData.dockType,
          dock_hours_start: formData.dockHoursStart || null,
          dock_hours_end: formData.dockHoursEnd || null,
          has_freight_elevator: formData.hasFreightElevator,
          has_passenger_elevator: formData.hasPassengerElevator,
          elevator_restrictions: formData.elevatorRestrictions || null,
          can_use_handcarts: formData.canUseHandcarts,
          protective_floor_covering: formData.protectiveFloorCovering,
          max_truck_size: formData.maxTruckSize || null,
          contact_name: formData.onSiteContactName || null,
          contact_email: formData.onSiteContactEmail || null,
          contact_phone: formData.onSiteContactPhone || null,
          is_primary: false,
        };
        // Fire and forget - don't block request submission
        createLocation.mutate(locationData);
      }

      const requestData = mapFormDataToRequestInsert(
        updatedFormData,
        currentUser.company_id,
        currentUser.id
      );

      createRequest.mutate(requestData, {
        onSuccess: () => {
          router.push("/requests");
        },
        onError: (err) => {
          setError(err.message);
        },
      });
    } catch (err) {
      setIsUploading(false);
      setError(err instanceof Error ? err.message : "Failed to upload files");
    }
  };

  return {
    submit,
    isUploading,
    isSubmitting: createRequest.isPending,
    error,
  };
}
