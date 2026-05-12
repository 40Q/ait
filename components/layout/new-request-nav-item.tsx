"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/hooks";
import { Truck, ChevronDown, Recycle, Box } from "lucide-react";

export function NewRequestNavItem({ isActive }: { isActive: boolean }) {
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
