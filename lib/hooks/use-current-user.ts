"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface CurrentUserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "client";
  company_id: string | null;
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
        .select("id, email, full_name, role, company_id")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      return profile as CurrentUserProfile;
    },
  });
}
