"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface CurrentUserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "client" | "manager";
  company_id: string | null;
  company_name: string | null;
  /** True when the user's company is a sub-company (has a parent_company_id) */
  is_sub_company_user: boolean;
  /** True when a manager has explicitly granted this user invoice access */
  invoice_access: boolean;
  /** Request form variant configured for this user's company */
  form_variant: string;
}

/**
 * Hook to get the current authenticated user's profile
 */
export function useCurrentUser() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<CurrentUserProfile | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, company_id, invoice_access, company:companies(name, parent_company_id, form_variant)")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Handle company relation - Supabase returns object for single FK relations
      const company = profile.company as unknown as { name: string; parent_company_id: string | null; form_variant: string } | null;

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        company_id: profile.company_id,
        company_name: company?.name ?? null,
        is_sub_company_user: !!company?.parent_company_id,
        invoice_access: profile.invoice_access ?? false,
        form_variant: company?.form_variant ?? 'standard',
      } as CurrentUserProfile;
    },
  });
}
