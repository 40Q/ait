"use client";

import { Loader2, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInviteUser } from "@/lib/hooks";

interface ResendInviteButtonProps {
  email: string;
  fullName: string | null;
  companyId: string;
}

export function ResendInviteButton({ email, fullName, companyId }: ResendInviteButtonProps) {
  const inviteUser = useInviteUser();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={() => inviteUser.mutate({ email, fullName: fullName || email, companyId })}
      disabled={inviteUser.isPending}
      title={inviteUser.isSuccess ? "Invite sent!" : "Resend invitation email"}
    >
      {inviteUser.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : inviteUser.isSuccess ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
    </Button>
  );
}
