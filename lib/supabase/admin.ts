import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client with secret key privileges.
 *
 * IMPORTANT: This client bypasses Row Level Security and should
 * ONLY be used in server-side code (API routes, server actions).
 * Never expose this to the client.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY. This is required for admin operations."
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
