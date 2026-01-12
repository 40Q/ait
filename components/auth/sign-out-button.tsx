"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  redirectTo?: string;
}

export function SignOutButton({
  className,
  variant = "ghost",
  redirectTo = "/login",
}: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <Button
      variant={variant}
      className={cn("w-full justify-start gap-3", className)}
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Sign Out
    </Button>
  );
}
