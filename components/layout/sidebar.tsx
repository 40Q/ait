"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useCurrentUser } from "@/lib/hooks";
import { Truck, ChevronDown, Recycle, Box } from "lucide-react";
import { clientNavItems, type NavItem } from "./nav-items";

interface SidebarProps {
  className?: string;
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
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
      <span className="flex-1">{item.title}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

function NewRequestNavItem({ isActive }: { isActive: boolean }) {
  const { data: currentUser } = useCurrentUser();
  const isCyrusOne = currentUser?.form_variant === "cyrusone";

  const baseClass = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
  );

  if (!isCyrusOne) {
    return (
      <Link href="/requests/new" className={baseClass}>
        <Truck className="h-4 w-4" />
        <span className="flex-1">Request Pickup</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={baseClass}>
          <Truck className="h-4 w-4" />
          <span className="flex-1 text-left">Request Pickup</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/requests/new" className="cursor-pointer">
            <Truck className="mr-2 h-4 w-4" />
            E-Waste Pickup
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/requests/forms/materials" className="cursor-pointer">
            <Recycle className="mr-2 h-4 w-4" />
            Materials Pickup
            <span className="ml-auto text-xs text-muted-foreground">
              Wood/Metal/E-Waste
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/requests/forms/logistics" className="cursor-pointer">
            <Box className="mr-2 h-4 w-4" />
            Logistics Request
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar({ className }: SidebarProps) {
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
        <span className="ml-2 font-bold text-sidebar-foreground">
          AIT Portal
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {clientNavItems.map((item) =>
          item.href === "/requests/new" ? (
            <NewRequestNavItem
              key={item.href}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ) : (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          )
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <SignOutButton className="text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground" />
      </div>
    </aside>
  );
}
