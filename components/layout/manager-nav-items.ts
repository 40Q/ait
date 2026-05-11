import {
  LayoutDashboard,
  Building2,
  Truck,
  ClipboardList,
  Briefcase,
  FileCheck,
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
    ],
  },
  {
    label: "Client Portal",
    items: [
      { title: "Request Pickup", href: "/requests/new", icon: Truck },
      { title: "My Requests", href: "/requests", icon: ClipboardList },
      { title: "Jobs", href: "/jobs", icon: Briefcase },
      { title: "Documents", href: "/documents", icon: FileCheck },
      { title: "Locations", href: "/locations", icon: MapPin },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const managerNavItems: ManagerNavItem[] = managerNavSections.flatMap((s) => s.items);
