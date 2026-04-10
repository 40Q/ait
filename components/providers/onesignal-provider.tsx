"use client";

import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/hooks";
import OneSignal from "react-onesignal";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";

let initPromise: Promise<boolean> | null = null;

async function ensureInitialized(): Promise<boolean> {
  if (!ONESIGNAL_APP_ID) {
    console.warn("[OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID is not set");
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
        console.log("[OneSignal] Initialized");
        return true;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already initialized")
        ) {
          console.log("[OneSignal] Already initialized");
          return true;
        }
        console.error("[OneSignal] Init failed:", error);
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
      console.log("[OneSignal] Starting registration for user", currentUser.id);
      const initialized = await ensureInitialized();
      if (!initialized) {
        console.warn("[OneSignal] Init failed, aborting registration");
        return;
      }

      try {
        try {
          await OneSignal.login(currentUser.id);
          console.log("[OneSignal] Logged in");
        } catch (e) {
          console.warn("[OneSignal] Login error (non-fatal):", e);
        }

        try {
          await OneSignal.User.addEmail(currentUser.email);
          console.log("[OneSignal] Email added");
        } catch (e) {
          console.warn("[OneSignal] addEmail error (non-fatal):", e);
        }

        const tags: Record<string, string> = {
          user_role: currentUser.role,
        };
        if (currentUser.company_id) {
          tags.company_id = currentUser.company_id;
        }
        await OneSignal.User.addTags(tags);
        console.log("[OneSignal] Tags set:", tags);

        const permissionNative = OneSignal.Notifications.permissionNative;
        const permission = OneSignal.Notifications.permission;
        console.log("[OneSignal] Permission native:", permissionNative, "| granted:", permission);

        if (!permission) {
          if (permissionNative === "denied") {
            console.warn("[OneSignal] Push permission was denied by user — cannot prompt again");
          } else {
            console.log("[OneSignal] Requesting permission via Slidedown.promptPush()");
            await OneSignal.Slidedown.promptPush({ force: true });
          }
        } else {
          console.log("[OneSignal] Permission already granted");
        }

        userRegisteredRef.current = currentUser.id;
      } catch (e) {
        console.error("[OneSignal] Registration error:", e);
      }
    };

    registerUser();
  }, [currentUser?.id, currentUser?.email, currentUser?.role, currentUser?.company_id]);

  return <>{children}</>;
}
