import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { ResendInviteButton } from "./_components/resend-invite-button";

interface AuthCodeErrorPageProps {
  searchParams: Promise<{ email?: string }>;
}

async function getUnconfirmedEmail(email: string | undefined): Promise<string | null> {
  if (!email) return null;

  try {
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!profile) return null;

    const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id);

    // Only allow resend if the user exists and hasn't confirmed yet
    if (!authUser?.user || authUser.user.confirmed_at) return null;

    return email;
  } catch {
    return null;
  }
}

export default async function AuthCodeErrorPage({ searchParams }: AuthCodeErrorPageProps) {
  const { email } = await searchParams;
  const validEmail = await getUnconfirmedEmail(email);

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>Invalid or Expired Link</CardTitle>
        <CardDescription>
          The link you clicked is no longer valid. This can happen if the
          link has expired or has already been used.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {validEmail ? (
          <ResendInviteButton email={validEmail} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Please contact your administrator to request a new invitation.
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Go to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
