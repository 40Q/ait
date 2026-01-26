"use client";

import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/hooks";
import OneSignal from "react-onesignal";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";

let initPromise: Promise<boolean> | null = null;

async function ensureInitialized(): Promise<boolean> {
  if (!ONESIGNAL_APP_ID) {
    return false;
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
          serviceWorkerParam: { scope: "/" },
          serviceWorkerPath: "/OneSignalSDKWorker.js",
        });
        return true;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already initialized")
        ) {
          return true;
        }
        initPromise = null;
        return false;
      }
    })();
  }

  return initPromise;
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { data: currentUser } = useCurrentUser();
  const userRegisteredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id || !currentUser?.email || !currentUser?.role) return;
    if (userRegisteredRef.current === currentUser.id) return;

    const registerUser = async () => {
      const initialized = await ensureInitialized();
      if (!initialized) return;

      try {
        // Try to login with external user ID
        // This may fail with 409 if the ID is already linked to another subscription
        // That's OK - we use tags for targeting, not external_id
        try {
          await OneSignal.login(currentUser.id);
        } catch {
          // Ignore login errors - tags will still work for targeting
        }

        // Add email for email notifications
        try {
          await OneSignal.User.addEmail(currentUser.email);
        } catch {
          // Ignore email errors
        }

        // Add tags for role-based and company-based targeting
        const tags: Record<string, string> = {
          user_role: currentUser.role,
        };
        if (currentUser.company_id) {
          tags.company_id = currentUser.company_id;
        }
        await OneSignal.User.addTags(tags);

        // Request permission if not granted
        const permission = await OneSignal.Notifications.permission;
        if (!permission) {
          await OneSignal.Notifications.requestPermission();
        }

        userRegisteredRef.current = currentUser.id;
      } catch {
        // Silent fail - notifications are not critical
      }
    };

    registerUser();
  }, [currentUser?.id, currentUser?.email, currentUser?.role, currentUser?.company_id]);

  return <>{children}</>;
}
