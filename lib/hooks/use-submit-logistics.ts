"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateRequest, useCurrentUser } from "@/lib/hooks";

interface LocalLogisticsFormData {
  authorizedPersonName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContactMethod: "phone" | "email";
  pickupDateRequested: Date | null;
  pickupAddress: string;
  destinationAddress: string;
  coiRequired: boolean | null;
  isMaterialPrepared: boolean | null;
  materialFitsOnPallets: string;
  numberOfPallets: string;
  sizeOfPallets: string;
  heightOfPalletizedMaterial: string;
  estimatedWeightPerPallet: string;
  needsPalletizing: boolean;
  needsShrinkWrap: boolean;
  needsPalletStrap: boolean;
  whiteGloveService: boolean;
  additionalComments: string;
}

export function useSubmitLogistics() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const createRequest = useCreateRequest();
  const [error, setError] = useState<string | null>(null);

  const submit = async (formData: LocalLogisticsFormData) => {
    if (!currentUser?.company_id) {
      setError("Unable to submit: No company associated with your account");
      return;
    }

    setError(null);

    createRequest.mutate(
      {
        company_id: currentUser.company_id,
        submitted_by: currentUser.id,
        status: "pending",
        form_type: "logistics",
        form_data: {
          destination_address: formData.destinationAddress,
          preferred_contact_method: formData.preferredContactMethod,
          material_fits_on_pallets: formData.materialFitsOnPallets,
          number_of_pallets: formData.numberOfPallets,
          size_of_pallets: formData.sizeOfPallets,
          height_of_palletized_material: formData.heightOfPalletizedMaterial,
          estimated_weight_per_pallet: formData.estimatedWeightPerPallet,
          needs_palletizing: formData.needsPalletizing,
          needs_shrink_wrap: formData.needsShrinkWrap,
          needs_pallet_strap: formData.needsPalletStrap,
        },
        address: formData.pickupAddress,
        on_site_contact_name: formData.authorizedPersonName,
        on_site_contact_email: formData.contactEmail,
        on_site_contact_phone: formData.contactPhone,
        preferred_date: formData.pickupDateRequested?.toISOString() || null,
        coi_required: formData.coiRequired ?? false,
        material_prepared: formData.isMaterialPrepared,
        white_glove_service: formData.whiteGloveService,
        additional_notes: formData.additionalComments || null,
      },
      {
        onSuccess: () => router.push("/requests"),
        onError: (err) => setError(err.message),
      }
    );
  };

  return {
    submit,
    isSubmitting: createRequest.isPending,
    error,
  };
}

export type { LocalLogisticsFormData };
