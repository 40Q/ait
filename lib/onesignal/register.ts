import { after } from "next/server";
import { onesignalClient } from "./client";

interface RegisterParams {
  externalId: string;
  email: string;
  role: string;
  companyId?: string;
}

/**
 * Register a user with OneSignal without making the caller wait.
 *
 * This must NOT be a floating promise: on serverless the invocation can be
 * frozen or reclaimed the moment the response is returned, dropping the
 * registration. A user who misses it stays untagged in OneSignal, and every
 * tag-filtered notification (all broadcasts and company sends) silently
 * skips them. `after()` keeps the invocation alive until it completes.
 */
export function registerUserEmailAfterResponse(params: RegisterParams): void {
  const run = async () => {
    try {
      const ok = await onesignalClient.registerUserEmail(params);
      if (!ok) {
        console.error(
          `[OneSignal] Registration returned failure for ${params.email} — user will not receive notifications`
        );
      }
    } catch (error) {
      console.error("[OneSignal] Registration failed:", error);
    }
  };

  try {
    after(run);
  } catch {
    // Outside a request scope (scripts, jobs, tests).
    void run();
  }
}
