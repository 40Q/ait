"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useCurrentUser } from "@/lib/hooks";
import { Truck, Recycle, Box } from "lucide-react";
import { clientNavItems, type NavItem } from "./nav-items";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MobileNavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{item.title}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

function NewRequestMobileNavItem({
  isActive,
  pathname,
  onNavigate,
}: {
  isActive: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const { data: currentUser } = useCurrentUser();
  const isCyrusOne = currentUser?.form_variant === "cyrusone";

  const baseClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  if (!isCyrusOne) {
    return (
      <Link href="/requests/new" onClick={onNavigate} className={baseClass(isActive)}>
        <Truck className="h-5 w-5" />
        <span className="flex-1">Request Pickup</span>
      </Link>
    );
  }

  const subItems: Array<{
    href: string;
    icon: typeof Truck;
    label: string;
    hint?: string;
  }> = [
    {
      href: "/requests/new",
      icon: Truck,
      label: "E-Waste Pickup",
    },
    {
      href: "/requests/forms/materials",
      icon: Recycle,
      label: "Materials Pickup",
      hint: "Wood/Metal/E-Waste",
    },
    {
      href: "/requests/forms/logistics",
      icon: Box,
      label: "Logistics Request",
    },
  ];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
        <Truck className="h-4 w-4" />
        <span>Request Pickup</span>
      </div>
      <div className="space-y-1 pl-2">
        {subItems.map((item) => {
          const Icon = item.icon;
          const subActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={baseClass(subActive)}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.hint && (
                <span className="text-xs text-muted-foreground/70">{item.hint}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();

  const handleNavigate = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Logo size="sm" showText={false} />
            <span>AIT Portal</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {clientNavItems.map((item) =>
            item.href === "/requests/new" ? (
              <NewRequestMobileNavItem
                key={item.href}
                isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                pathname={pathname}
                onNavigate={handleNavigate}
              />
            ) : (
              <MobileNavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                onNavigate={handleNavigate}
              />
            )
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <SignOutButton className="text-muted-foreground hover:text-foreground" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
