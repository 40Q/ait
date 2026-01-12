// Force dynamic rendering for auth pages (Supabase client needs env vars at runtime)
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
