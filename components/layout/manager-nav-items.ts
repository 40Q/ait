import { LayoutDashboard, Building2, Receipt, LucideIcon } from "lucide-react";

export interface ManagerNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const managerNavItems: ManagerNavItem[] = [
  {
    title: "Dashboard",
    href: "/manager/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Companies",
    href: "/manager/companies",
    icon: Building2,
  },
  {
    title: "Invoices",
    href: "/manager/invoices",
    icon: Receipt,
  },
];
