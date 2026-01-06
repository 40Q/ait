import { AdminLayout } from "@/components/layout";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In a real app, this would be fetched from the database
  const pendingRequestsCount = 3;

  return (
    <AdminLayout pendingRequestsCount={pendingRequestsCount}>
      {children}
    </AdminLayout>
  );
}
