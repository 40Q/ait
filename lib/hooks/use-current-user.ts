"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface CurrentUserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "client";
  company_id: string | null;
  company_name: string | null;
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
        .select("id, email, full_name, role, company_id, company:companies(name)")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Handle company relation - Supabase returns object for single FK relations
      const company = profile.company as unknown as { name: string } | null;

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        company_id: profile.company_id,
        company_name: company?.name ?? null,
      } as CurrentUserProfile;
    },
  });
}
