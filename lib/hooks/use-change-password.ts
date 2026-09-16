"use client";

import { useMutation } from "@tanstack/react-query";

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

async function changePassword(
  params: ChangePasswordParams
): Promise<ChangePasswordResponse> {
  const response = await fetch("/api/account/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to change password");
  }

  return result;
}

/**
 * Hook to change the current user's password.
 * Calls the account API after current password has been verified client-side.
 * The current password is also sent so the API can reauthenticate server-side.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
