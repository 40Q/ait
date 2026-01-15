import { AdminLayout } from "@/components/layout";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
