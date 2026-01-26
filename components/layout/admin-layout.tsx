"use client";

import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useRequestStatusCounts } from "@/lib/hooks";
import { OneSignalProvider } from "@/components/providers/onesignal-provider";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: statusCounts } = useRequestStatusCounts();
  const pendingRequestsCount = statusCounts?.pending ?? 0;

  return (
    <OneSignalProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex">
          <AdminSidebar pendingRequestsCount={pendingRequestsCount} />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <AdminSidebar pendingRequestsCount={pendingRequestsCount} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </OneSignalProvider>
  );
}
