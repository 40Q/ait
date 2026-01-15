"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Eye, EyeOff, Loader2, AlertCircle, Shield } from "lucide-react";
import { getUserProfile, getDashboardPath } from "@/lib/auth/helpers";

type LoginStep = "credentials" | "mfa" | "mfa_setup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<LoginStep>("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingHash, setIsCheckingHash] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle invite/recovery tokens in URL hash (implicit flow)
  useEffect(() => {
    const handleHashTokens = async () => {
      const hash = window.location.hash;
      if (!hash) {
        setIsCheckingHash(false);
        return;
      }

      // Parse hash parameters
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (accessToken && refreshToken) {
        // Set the session from the tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);

          // If this is an invite or recovery, redirect to set password
          if (type === "invite" || type === "recovery") {
            router.push("/auth/set-password");
            return;
          }

          // Otherwise, check role and redirect to dashboard
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const profile = await getUserProfile(supabase, user.id);
            router.push(getDashboardPath(profile?.role));
            return;
          }
        }
      }

      setIsCheckingHash(false);
    };

    handleHashTokens();
  }, [supabase, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      // Check if MFA is enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors();

      if (factors?.totp && factors.totp.length > 0) {
        // MFA is enrolled, need to verify
        const totpFactor = factors.totp[0];
        setFactorId(totpFactor.id);

        const { error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId: totpFactor.id });

        if (challengeError) {
          setError(challengeError.message);
          setIsLoading(false);
          return;
        }

        setStep("mfa");
        setIsLoading(false);
      } else {
        // No MFA enrolled, require MFA setup
        const { data: enrollData, error: enrollError } =
          await supabase.auth.mfa.enroll({ factorType: "totp" });

        if (enrollError) {
          setError(enrollError.message);
          setIsLoading(false);
          return;
        }

        setFactorId(enrollData.id);
        setQrCode(enrollData.totp.qr_code);
        setSecret(enrollData.totp.secret);
        setStep("mfa_setup");
        setIsLoading(false);
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!factorId) {
      setError("MFA factor not found");
      setIsLoading(false);
      return;
    }

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(challengeError.message);
        setIsLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) {
        setError(verifyError.message);
        setIsLoading(false);
        return;
      }

      // Check role and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await getUserProfile(supabase, user.id);
        router.push(getDashboardPath(profile?.role));
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!factorId) {
      setError("MFA factor not found");
      setIsLoading(false);
      return;
    }

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(challengeError.message);
        setIsLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) {
        setError(verifyError.message);
        setIsLoading(false);
        return;
      }

      // Check role and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await getUserProfile(supabase, user.id);
        router.push(getDashboardPath(profile?.role));
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Show loading while checking for hash tokens
  if (isCheckingHash) {
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
            <CardTitle>
              {step === "credentials" && "Sign In"}
              {step === "mfa" && "Verify Your Identity"}
              {step === "mfa_setup" && "Set Up Two-Factor Authentication"}
            </CardTitle>
            <CardDescription>
              {step === "credentials" && "Enter your company credentials to access the portal"}
              {step === "mfa" && "Enter the verification code from your authenticator app"}
              {step === "mfa_setup" && "Scan the QR code with your authenticator app to secure your account"}
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

          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="company@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
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
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot your password?
                </Link>
              </CardFooter>
            </form>
          )}

          {step === "mfa" && (
            <form onSubmit={handleMfaSubmit}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Verification Code</Label>
                  <Input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    required
                    autoComplete="one-time-code"
                    className="text-center text-lg tracking-widest"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button type="submit" className="w-full" disabled={isLoading || mfaCode.length !== 6}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Sign In
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground"
                  onClick={() => {
                    setStep("credentials");
                    setMfaCode("");
                    setFactorId(null);
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Back to login
                </Button>
              </CardFooter>
            </form>
          )}

          {step === "mfa_setup" && (
            <form onSubmit={handleMfaSetup}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                {qrCode && (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="MFA QR Code" className="rounded-lg border" />
                  </div>
                )}
                {secret && (
                  <div className="text-center text-xs text-muted-foreground">
                    <p>Or enter this code manually:</p>
                    <code className="block mt-1 p-2 bg-muted rounded font-mono text-xs break-all">
                      {secret}
                    </code>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="mfa-setup-code">Enter Code to Confirm</Label>
                  <Input
                    id="mfa-setup-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    required
                    autoComplete="one-time-code"
                    className="text-center text-lg tracking-widest"
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoading || mfaCode.length !== 6}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup & Sign In
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/support" className="text-primary hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
