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
  /** Name of the parent company when this user belongs to a sub-company */
  parent_company_name: string | null;
  /** True when a manager has granted this sub-company user access to parent company invoices */
  invoice_access: boolean;
  /** Request form variant configured for this user's company */
  form_variant: string;
}

export function useCurrentUser() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<CurrentUserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, company_id, invoice_access, company:companies(name, parent_company_id, form_variant)")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const company = profile.company as unknown as {
        name: string;
        parent_company_id: string | null;
        form_variant: string;
      } | null;

      let parent_company_name: string | null = null;
      if (company?.parent_company_id) {
        const { data } = await supabase
          .from("companies")
          .select("name")
          .eq("id", company.parent_company_id)
          .single();
        parent_company_name = data?.name ?? null;
      }

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        company_id: profile.company_id,
        company_name: company?.name ?? null,
        is_sub_company_user: !!company?.parent_company_id,
        parent_company_name,
        invoice_access: profile.invoice_access ?? false,
        form_variant: company?.form_variant ?? "standard",
      };
    },
  });
}
