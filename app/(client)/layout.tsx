import { ClientLayout, ManagerLayout } from "@/components/layout";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth/helpers";

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getUserProfile(supabase, user.id) : null;

  if (profile?.role === "manager") {
    return <ManagerLayout>{children}</ManagerLayout>;
  }

  return <ClientLayout>{children}</ClientLayout>;
}
