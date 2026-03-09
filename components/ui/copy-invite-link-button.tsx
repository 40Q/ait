"use client";

import { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyInviteLinkButtonProps {
  userId: string;
}

export function CopyInviteLinkButton({ userId }: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/invite-link`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await navigator.clipboard.writeText(result.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      disabled={loading}
      title="Copy invitation link"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
