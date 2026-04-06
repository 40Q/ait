import { ManagerLayout } from "@/components/layout";

export default function ManagerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagerLayout>{children}</ManagerLayout>;
}
