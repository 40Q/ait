"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { managerNavSections, type ManagerNavItem } from "./manager-nav-items";

interface ManagerSidebarProps {
  className?: string;
}

function NavLink({ item, isActive }: { item: ManagerNavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.title}</span>
    </Link>
  );
}

export function ManagerSidebar({ className }: ManagerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Logo size="sm" showText={false} />
        <span className="ml-2 font-bold text-sidebar-foreground">AIT Portal</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {managerNavSections.map((section) => (
          <div key={section.label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <SignOutButton className="text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground" />
      </div>
    </aside>
  );
}
