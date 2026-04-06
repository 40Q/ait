"use client";

import { useState, type ReactNode } from "react";
import { Header } from "./header";
import { ManagerSidebar } from "./manager-sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { OneSignalProvider } from "@/components/providers/onesignal-provider";

interface ManagerLayoutProps {
  children: ReactNode;
}

export function ManagerLayout({ children }: ManagerLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <OneSignalProvider>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <ManagerSidebar className="hidden lg:flex" />

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <ManagerSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <Header onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </OneSignalProvider>
  );
}
