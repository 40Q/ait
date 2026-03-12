"use client";

import { useState } from "react";
import { Loader2, KeyRound, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SendRecoveryEmailButtonProps {
  userId: string;
}

export function SendRecoveryEmailButton({ userId }: SendRecoveryEmailButtonProps) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/send-recovery-email`,
        { method: "POST" }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={handleSend}
      disabled={loading}
      title={error ?? (sent ? "Email sent!" : "Send password recovery email")}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : sent ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <KeyRound className="h-4 w-4" />
      )}
    </Button>
  );
}
