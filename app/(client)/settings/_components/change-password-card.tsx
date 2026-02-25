"use client";

import { useRef, useState, useMemo } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
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
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useCurrentUser, useChangePassword } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_REQUIREMENTS = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasUppercase", label: "One uppercase letter" },
  { key: "hasLowercase", label: "One lowercase letter" },
  { key: "hasNumber", label: "One number" },
  { key: "hasSpecial", label: "One special character (!@#$%^&*...)" },
  { key: "passwordsMatch", label: "Passwords match" },
] as const;

export function ChangePasswordCard() {
  const { data: currentUser } = useCurrentUser();
  const changePassword = useChangePassword();
  const supabase = createClient();
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();

  const passwordChecks = useMemo(
    () => ({
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      passwordsMatch:
        newPassword === confirmPassword && newPassword.length > 0,
    }),
    [newPassword, confirmPassword]
  );

  const isFormValid =
    currentPassword.length > 0 &&
    Object.values(passwordChecks).every(Boolean);

  const isLoading = isVerifying || changePassword.isPending;
  const error = verifyError || (changePassword.error?.message ?? null);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setSuccess(false);
    changePassword.reset();
    setIsVerifying(true);

    try {
      // Verify current password client-side (requires captcha token)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser?.email ?? "",
        password: currentPassword,
        options: { captchaToken },
      });

      // Reset captcha for next attempt
      turnstileRef.current?.reset();
      setCaptchaToken(undefined);

      if (signInError) {
        setVerifyError("Current password is incorrect");
        setIsVerifying(false);
        return;
      }

      setIsVerifying(false);

      // Current password verified — update via API
      changePassword.mutate(
        { newPassword, confirmPassword },
        {
          onSuccess: () => {
            setSuccess(true);
            resetForm();
          },
        }
      );
    } catch {
      setVerifyError("An unexpected error occurred");
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Your password has been changed successfully.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setVerifyError(null);
                  setSuccess(false);
                  changePassword.reset();
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPasswords ? "Hide passwords" : "Show passwords"}
                </span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type={showPasswords ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPasswords ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">Password requirements:</p>
            <ul className="space-y-1">
              {PASSWORD_REQUIREMENTS.map(({ key, label }) => (
                <li key={key} className="flex items-center gap-2">
                  {passwordChecks[key] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground/50" />
                  )}
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setCaptchaToken(token)}
          />

          <Button
            type="submit"
            disabled={isLoading || !isFormValid || !captchaToken}
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Change Password
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
