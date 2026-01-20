import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Building2,
  Briefcase,
  FolderOpen,
  Receipt,
  Settings,
  Calendar,
  LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Pickup Requests",
    href: "/admin/requests",
    icon: ClipboardList,
  },
  {
    title: "Quotes",
    href: "/admin/quotes",
    icon: FileText,
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
  },
  {
    title: "Jobs",
    href: "/admin/jobs",
    icon: Briefcase,
  },
  {
    title: "Calendar",
    href: "/admin/calendar",
    icon: Calendar,
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: FolderOpen,
  },
  {
    title: "Invoices",
    href: "/admin/invoices",
    icon: Receipt,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];
