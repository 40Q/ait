"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRequestNewLink } from "@/lib/hooks";

export function ResendInviteButton({ email }: { email: string }) {
  const requestNewLink = useRequestNewLink();

  if (requestNewLink.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <p className="font-medium">Invitation resent</p>
        <p className="text-sm text-muted-foreground">
          A new invitation has been sent to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Your invitation link has expired. We can resend it to <strong>{email}</strong>.
      </p>
      <Button
        className="w-full"
        onClick={() => requestNewLink.mutate(email)}
        disabled={requestNewLink.isPending}
      >
        {requestNewLink.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Resend Invitation
      </Button>
    </div>
  );
}
