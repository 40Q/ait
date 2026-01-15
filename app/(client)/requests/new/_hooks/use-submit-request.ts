"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, uploadFiles, STORAGE_BUCKETS } from "@/lib/storage/upload";
import { useCreateRequest, useCurrentUser } from "@/lib/hooks";
import { mapFormDataToRequestInsert, type PickupRequestFormData } from "../_components/types";

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
