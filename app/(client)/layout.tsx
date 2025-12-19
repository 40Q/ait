import { ClientLayout } from "@/components/layout";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
