"use client";

import { PageHeader } from "@/components/ui/page-header";
import { ChangePasswordCard } from "./_components/change-password-card";

export default function ClientSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Manage your account password"
      />
      <div className="max-w-2xl space-y-6">
        <ChangePasswordCard />
      </div>
    </div>
  );
}
