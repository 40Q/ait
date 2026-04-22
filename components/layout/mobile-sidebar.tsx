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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useCurrentUser } from "@/lib/hooks";
import { Truck, ChevronDown, Recycle, Box } from "lucide-react";
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
  onNavigate,
}: {
  isActive: boolean;
  onNavigate: () => void;
}) {
  const { data: currentUser } = useCurrentUser();
  const isCyrusOne = currentUser?.form_variant === "cyrusone";

  const baseClass = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

  if (!isCyrusOne) {
    return (
      <Link href="/requests/new" onClick={onNavigate} className={baseClass}>
        <Truck className="h-5 w-5" />
        <span className="flex-1">Request Pickup</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(baseClass, "w-full")}>
          <Truck className="h-5 w-5" />
          <span className="flex-1 text-left">Request Pickup</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        <DropdownMenuLabel>Standard Forms</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/requests/new" onClick={onNavigate} className="cursor-pointer">
            <Truck className="mr-2 h-4 w-4" />
            Pickup Request
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Additional Forms</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/requests/forms/materials" onClick={onNavigate} className="cursor-pointer">
            <Recycle className="mr-2 h-4 w-4" />
            Materials Pickup
            <span className="ml-auto text-xs text-muted-foreground">
              Wood/Metal/E-Waste
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/requests/forms/logistics" onClick={onNavigate} className="cursor-pointer">
            <Box className="mr-2 h-4 w-4" />
            Logistics Request
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
