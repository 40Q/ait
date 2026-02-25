"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useCurrentUser, useUpdateEmail } from "@/lib/hooks";

export function ChangeEmailCard() {
  const { data: currentUser } = useCurrentUser();
  const updateEmail = useUpdateEmail();

  const [newEmail, setNewEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    updateEmail.mutate(
      { newEmail },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
          setNewEmail("");
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Address</CardTitle>
        <CardDescription>
          Update the email address associated with your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Current Email</Label>
            <p className="text-sm font-medium">
              {currentUser?.email || "Loading..."}
            </p>
          </div>

          {successMessage && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {updateEmail.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{updateEmail.error.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="newEmail">New Email</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="Enter new email address"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setSuccessMessage(null);
                updateEmail.reset();
              }}
              disabled={updateEmail.isPending}
              autoComplete="email"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            A confirmation email will be sent to the new address. The change
            won&apos;t take effect until you confirm it.
          </p>

          <Button
            type="submit"
            disabled={updateEmail.isPending || !newEmail}
          >
            {updateEmail.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Email
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
