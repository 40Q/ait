"use client";

import { useMutation } from "@tanstack/react-query";

interface UpdateEmailParams {
  newEmail: string;
}

interface UpdateEmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

async function updateEmail(
  params: UpdateEmailParams
): Promise<UpdateEmailResponse> {
  const response = await fetch("/api/account/update-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to update email");
  }

  return result;
}

/**
 * Hook to update the current user's email.
 * Triggers confirmation emails to both the current and new addresses.
 */
export function useUpdateEmail() {
  return useMutation({
    mutationFn: updateEmail,
  });
}
