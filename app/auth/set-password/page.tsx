"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check if user has a valid session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No session, redirect to login
        router.push("/login");
        return;
      }

      setUserEmail(user.email || null);
      setIsCheckingSession(false);
    };

    checkSession();
  }, [supabase, router]);

  // Password strength validation
  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    passwordsMatch: password === confirmPassword && password.length > 0,
  }), [password, confirmPassword]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Password set successfully - sign out and redirect to login
      // User will go through normal login flow with MFA
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Set Your Password</CardTitle>
            <CardDescription>
              {userEmail ? (
                <>Welcome! Create a password for <strong>{userEmail}</strong></>
              ) : (
                "Create a secure password for your account"
              )}
            </CardDescription>
          </CardHeader>

          {error && (
            <div className="px-6 pb-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">Password requirements:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    {passwordChecks.minLength ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordChecks.hasUppercase ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordChecks.hasLowercase ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordChecks.hasNumber ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    One number
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordChecks.hasSpecial ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    One special character (!@#$%^&amp;*...)
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordChecks.passwordsMatch ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    Passwords match
                  </li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                After setting your password, you&apos;ll be redirected to sign in.
              </p>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isPasswordValid}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
