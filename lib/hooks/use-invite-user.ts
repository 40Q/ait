"use client";

import { useMutation } from "@tanstack/react-query";

interface InviteUserParams {
  email: string;
  fullName: string;
  companyId: string;
  role?: "client" | "admin";
}

interface InviteUserResponse {
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
}

async function inviteUser(params: InviteUserParams): Promise<InviteUserResponse> {
  const response = await fetch("/api/admin/invite-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to send invitation");
  }

  return result;
}

/**
 * Hook to invite a user to a company.
 * Sends an email with a link to set their password.
 */
export function useInviteUser() {
  return useMutation({
    mutationFn: inviteUser,
  });
}
