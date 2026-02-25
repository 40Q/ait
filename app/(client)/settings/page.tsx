"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";
import { ChangeEmailCard } from "./_components/change-email-card";
import { ChangePasswordCard } from "./_components/change-password-card";

function SettingsContent() {
  const searchParams = useSearchParams();
  const emailConfirmedMessage = searchParams.get("email_confirmed");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Manage your account email and password"
      />
      <div className="max-w-2xl space-y-6">
        {emailConfirmedMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{emailConfirmedMessage}</AlertDescription>
          </Alert>
        )}
        <ChangeEmailCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}

export default function ClientSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
