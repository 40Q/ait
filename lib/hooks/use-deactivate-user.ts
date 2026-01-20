"use client";

import { useMutation } from "@tanstack/react-query";

interface DeactivateUserResponse {
  success: boolean;
  email?: string;
  message?: string;
  error?: string;
}

async function deactivateUser(userId: string): Promise<DeactivateUserResponse> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "POST",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to deactivate user");
  }

  return result;
}

/**
 * Hook to deactivate a user.
 * Bans the user in Supabase Auth so they can no longer log in.
 * All data is preserved.
 */
export function useDeactivateUser() {
  return useMutation({
    mutationFn: deactivateUser,
  });
}
