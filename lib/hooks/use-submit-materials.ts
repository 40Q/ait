"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateRequest, useCurrentUser } from "@/lib/hooks";

interface LocalMaterialsFormData {
  hasWood: boolean;
  hasMetal: boolean;
  hasElectronics: boolean;
  pickupLocation: string;
  siteContactName: string;
  siteContactPhone: string;
  siteContactEmail: string;
  materialsDescription: string;
}

export function useSubmitMaterials() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const createRequest = useCreateRequest();
  const [error, setError] = useState<string | null>(null);

  const submit = async (formData: LocalMaterialsFormData) => {
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
        form_type: "materials",
        form_data: {
          has_wood: formData.hasWood,
          has_metal: formData.hasMetal,
          has_electronics: formData.hasElectronics,
          materials_description: formData.materialsDescription,
        },
        address: formData.pickupLocation,
        on_site_contact_name: formData.siteContactName,
        on_site_contact_phone: formData.siteContactPhone,
        on_site_contact_email: formData.siteContactEmail,
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

export type { LocalMaterialsFormData };
