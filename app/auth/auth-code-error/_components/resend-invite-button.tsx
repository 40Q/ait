"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRequestNewLink } from "@/lib/hooks";

export function ResendInviteButton() {
  const [email, setEmail] = useState("");
  const requestNewLink = useRequestNewLink();

  if (requestNewLink.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          If <strong>{email}</strong> has a pending invitation, we sent a new link.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        requestNewLink.mutate(email);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="resend-email">Your email address</Label>
        <Input
          id="resend-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={requestNewLink.isPending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={requestNewLink.isPending || !email}>
        {requestNewLink.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Resend Invitation
      </Button>
    </form>
  );
}
