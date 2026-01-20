import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  Briefcase,
  FileCheck,
  FileText,
  Receipt,
  MapPin,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export const clientNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Request Pickup",
    href: "/requests/new",
    icon: Truck,
  },
  {
    title: "My Requests",
    href: "/requests",
    icon: ClipboardList,
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileCheck,
  },
  {
    title: "Pickup Details",
    href: "/pickup-details",
    icon: FileText,
  },
  {
    title: "Locations",
    href: "/locations",
    icon: MapPin,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: Receipt,
  },
];
