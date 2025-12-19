"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

interface AdminMobileSidebarProps {
  pendingRequestsCount?: number;
}

export function AdminMobileSidebar({
  pendingRequestsCount,
}: AdminMobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <AdminSidebar pendingRequestsCount={pendingRequestsCount} />
      </SheetContent>
    </Sheet>
  );
}
