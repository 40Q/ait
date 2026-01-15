import { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "client";

export interface UserProfile {
  role: UserRole;
}

/**
 * Get the current user's profile (role) from the database.
 * Works with both client and server Supabase instances.
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile as UserProfile | null;
}

/**
 * Check if a user is an admin.
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const profile = await getUserProfile(supabase, userId);
  return profile?.role === "admin";
}

/**
 * Get the dashboard path for a user based on their role.
 */
export function getDashboardPath(role: UserRole | undefined): string {
  return role === "admin" ? "/admin/dashboard" : "/dashboard";
}
