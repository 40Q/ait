"use client";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

interface SyncEmailResponse {
  synced: boolean;
  error?: string;
}

async function syncEmail(): Promise<SyncEmailResponse> {
  const response = await fetch("/api/account/sync-email", {
    method: "POST",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to sync email");
  }

  return result;
}

/**
 * Hook to sync the auth user's email to the profiles table.
 * Invalidates the current-user query on success so the UI reflects the change.
 */
export function useSyncEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncEmail,
    onSuccess: (data) => {
      if (data.synced) {
        queryClient.invalidateQueries({ queryKey: ["current-user"] });
      }
    },
  });
}
