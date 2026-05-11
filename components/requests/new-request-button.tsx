"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Truck, ChevronDown, Recycle, Box } from "lucide-react";
import { useCurrentUser } from "@/lib/hooks";

interface NewRequestButtonProps {
  label?: string;
}

export function NewRequestButton({ label }: NewRequestButtonProps = {}) {
  const { data: currentUser } = useCurrentUser();
  const isCyrusOne = currentUser?.form_variant === "cyrusone";

  if (!isCyrusOne) {
    return (
      <Button asChild>
        <Link href="/requests/new">
          <Truck className="mr-2 h-4 w-4" />
          {label ?? "Request Pickup"}
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Truck className="mr-2 h-4 w-4" />
          {label ?? "New Request"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
