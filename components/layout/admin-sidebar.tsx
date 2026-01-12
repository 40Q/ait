"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { adminNavItems, type AdminNavItem } from "./admin-nav-items";

interface AdminSidebarProps {
  className?: string;
  pendingRequestsCount?: number;
}

function NavLink({
  item,
  isActive,
  badge,
}: {
  item: AdminNavItem;
  isActive: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  const showBadge = badge !== undefined && badge > 0;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{item.title}</span>
      {showBadge && (
        <Badge className="h-5 bg-primary px-1.5 text-xs text-primary-foreground">
          {badge}
        </Badge>
      )}
    </Link>
  );
}

export function AdminSidebar({
  className,
  pendingRequestsCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col bg-[#091824] text-white",
        className
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <Logo size="sm" showText={false} />
        <div className="ml-2">
          <span className="font-bold">AIT Admin</span>
          <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            }
            badge={item.href === "/admin/requests" ? pendingRequestsCount : undefined}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <SignOutButton
          className="text-white/70 hover:bg-white/5 hover:text-white"
          redirectTo="/login"
        />
      </div>
    </aside>
  );
}
