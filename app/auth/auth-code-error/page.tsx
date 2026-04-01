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
import { ResendInviteButton } from "./_components/resend-invite-button";

export default function AuthCodeErrorPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>Invalid or Expired Link</CardTitle>
        <CardDescription>
          The link you clicked is no longer valid. Enter your email below and
          we&apos;ll send you a new one if you have a pending invitation.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ResendInviteButton />
      </CardContent>

      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Go to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
