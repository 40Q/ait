import {
  LayoutDashboard,
  Building2,
  Receipt,
  Truck,
  ClipboardList,
  Briefcase,
  FileCheck,
  FileText,
  MapPin,
  Settings,
  LucideIcon,
} from "lucide-react";

export interface ManagerNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface ManagerNavSection {
  label: string;
  items: ManagerNavItem[];
}

export const managerNavSections: ManagerNavSection[] = [
  {
    label: "Management",
    items: [
      { title: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
      { title: "Companies", href: "/manager/companies", icon: Building2 },
      { title: "All Invoices", href: "/manager/invoices", icon: Receipt },
    ],
  },
  {
    label: "Client Portal",
    items: [
      { title: "Request Pickup", href: "/requests/new", icon: Truck },
      { title: "My Requests", href: "/requests", icon: ClipboardList },
      { title: "Jobs", href: "/jobs", icon: Briefcase },
      { title: "Documents", href: "/documents", icon: FileCheck },
      { title: "Pickup Details", href: "/pickup-details", icon: FileText },
      { title: "Locations", href: "/locations", icon: MapPin },
      { title: "Invoices", href: "/invoices", icon: Receipt },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const managerNavItems: ManagerNavItem[] = managerNavSections.flatMap((s) => s.items);
