"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks";

interface UseFormSubmitOptions<TFormData, TRequestData> {
  /** Transform form data to request data */
  transform: (formData: TFormData, userId: string, companyId: string) => TRequestData;
  /** Mutation function to call */
  mutation: {
    mutate: (
      data: TRequestData,
      options: { onSuccess: () => void; onError: (err: Error) => void }
    ) => void;
    isPending: boolean;
  };
  /** Path to redirect to on success */
  successRedirect?: string;
  /** Callback on success */
  onSuccess?: () => void;
  /** Custom error message when no company */
  noCompanyError?: string;
}

interface UseFormSubmitReturn<TFormData> {
  submit: (formData: TFormData) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Generic hook for form submissions with user validation
 *
 * @example
 * const { submit, isSubmitting, error } = useFormSubmit({
 *   transform: (formData, userId, companyId) => ({
 *     company_id: companyId,
 *     submitted_by: userId,
 *     ...formData,
 *   }),
 *   mutation: createRequest,
 *   successRedirect: "/requests",
 * });
 */
export function useFormSubmit<TFormData, TRequestData>({
  transform,
  mutation,
  successRedirect,
  onSuccess,
  noCompanyError = "Unable to submit: No company associated with your account",
}: UseFormSubmitOptions<TFormData, TRequestData>): UseFormSubmitReturn<TFormData> {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);

  const submit = async (formData: TFormData) => {
    if (!currentUser?.company_id) {
      setError(noCompanyError);
      return;
    }

    setError(null);

    const requestData = transform(formData, currentUser.id, currentUser.company_id);

    mutation.mutate(requestData, {
      onSuccess: () => {
        onSuccess?.();
        if (successRedirect) {
          router.push(successRedirect);
        }
      },
      onError: (err) => setError(err.message),
    });
  };

  return {
    submit,
    isSubmitting: mutation.isPending,
    error,
    clearError: () => setError(null),
  };
}
