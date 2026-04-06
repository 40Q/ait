"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SubCompany {
  id: string;
  name: string;
  contact_email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: string;
  created_at: string;
}

export interface SubCompanyUser {
  id: string;
  email: string;
  full_name: string | null;
  invite_pending: boolean;
  invoice_access: boolean;
}

interface CreateSubCompanyData {
  name: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface InviteSubCompanyUserParams {
  email: string;
  fullName: string;
  companyId: string;
}

interface InviteUserResponse {
  success: boolean;
  userId?: string;
  inviteLink?: string;
  message?: string;
}

/**
 * Fetch all sub-companies managed by the current manager.
 */
export function useManagerCompanies() {
  return useQuery({
    queryKey: ["manager", "companies"],
    queryFn: async (): Promise<SubCompany[]> => {
      const response = await fetch("/api/manager/companies");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch companies");
      }
      return response.json();
    },
  });
}

/**
 * Create a new sub-company under the manager's company.
 */
export function useCreateSubCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubCompanyData): Promise<SubCompany> => {
      const response = await fetch("/api/manager/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create company");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager", "companies"] });
    },
  });
}

/**
 * Fetch active users for a specific sub-company.
 */
export function useSubCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: ["manager", "companies", companyId, "users"],
    queryFn: async (): Promise<SubCompanyUser[]> => {
      const response = await fetch(`/api/manager/companies/${companyId}/users`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch users");
      }
      return response.json();
    },
    enabled: !!companyId,
  });
}

/**
 * Grant or revoke invoice access for a sub-company user.
 */
export function useToggleInvoiceAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, grant }: { userId: string; grant: boolean }) => {
      const response = await fetch(`/api/manager/users/${userId}/invoice-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update invoice access");
      }
      return result;
    },
    onSuccess: (_data, { userId }) => {
      // Invalidate all sub-company user queries so the UI reflects the change
      queryClient.invalidateQueries({ queryKey: ["manager", "companies"] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey.includes("users") });
    },
  });
}

/**
 * Deactivate (ban) a user belonging to a sub-company.
 */
export function useManagerDeactivateUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/manager/users/${userId}`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to remove user");
      }
      return result;
    },
  });
}

/**
 * Invite a user to a sub-company.
 */
export function useManagerInviteUser() {
  return useMutation({
    mutationFn: async (params: InviteSubCompanyUserParams): Promise<InviteUserResponse> => {
      const response = await fetch("/api/manager/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send invitation");
      }
      return result;
    },
  });
}
