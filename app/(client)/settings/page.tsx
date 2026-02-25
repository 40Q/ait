"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSyncEmail } from "@/lib/hooks";
import { ChangeEmailCard } from "./_components/change-email-card";
import { ChangePasswordCard } from "./_components/change-password-card";

function SettingsContent() {
  const searchParams = useSearchParams();
  const emailConfirmedParam = searchParams.get("email_confirmed");
  const [hashMessage, setHashMessage] = useState<string | null>(null);
  const syncEmail = useSyncEmail();

  // Handle Supabase hash-based redirects (#message=... from email confirmations)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.substring(1));
    const message = params.get("message");

    if (message) {
      setHashMessage(message);
      window.history.replaceState(null, "", window.location.pathname);
      syncEmail.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmationMessage = emailConfirmedParam || hashMessage;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Manage your account email and password"
      />
      <div className="max-w-2xl space-y-6">
        {confirmationMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{confirmationMessage}</AlertDescription>
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
