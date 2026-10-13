import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";

const PUBLIC_PATHS = new Set([
  "/", "/login", "/auth/callback", "/auth/set-password", "/auth/auth-code-error",
]);

/** Keep the open UI in sync with Auth, including sessions revoked on the server. */
export function monitorAuthSession(
  supabase: SupabaseClient,
  queryClient: QueryClient,
  browser: Window,
) {
  let userId: string | null | undefined;
  let generation = 0;
  let disposed = false;
  let navigating = false;
  let pending: Promise<void> | undefined;

  const endSession = () => {
    queryClient.clear();
    if (!navigating && !PUBLIC_PATHS.has(browser.location.pathname)) {
      navigating = true;
      // A full navigation also discards protected server components/router cache.
      browser.location.replace("/login?reason=session-ended");
    }
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (disposed) return;
    // INITIAL_SESSION can be null after a retryable refresh failure even though
    // the stored session remains valid. Let validate() confirm session loss.
    if (event === "INITIAL_SESSION" && !session) return;
    const nextUserId = session?.user.id ?? null;
    const previousUserId = userId;
    userId = nextUserId;
    if (previousUserId !== nextUserId) generation++;
    // This callback must remain synchronous: calling Auth here can deadlock its lock.
    if (!nextUserId) {
      endSession();
    } else if (previousUserId !== undefined && previousUserId !== nextUserId) {
      queryClient.clear();
      if (previousUserId !== null && !navigating) {
        navigating = true;
        browser.location.reload();
      }
    }
  });

  const validate = (): Promise<void> => {
    if (disposed || navigating || PUBLIC_PATHS.has(browser.location.pathname) ||
        browser.document.visibilityState !== "visible") return Promise.resolve();
    if (pending) return pending;
    const startedGeneration = generation;
    pending = (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (disposed || navigating || startedGeneration !== generation) return;
        // Network/service failures are not evidence of a signed-out account.
        const sessionGone = error?.name === "AuthSessionMissingError" ||
          ["session_not_found", "session_expired", "user_banned", "user_not_found", "bad_jwt"].includes(error?.code ?? "");
        if ((!user && !error) || sessionGone) {
          await supabase.auth.signOut({ scope: "local" });
          if (!disposed) endSession();
        }
      } catch {
        // Retry after connectivity returns or at the next visible-tab check.
      } finally {
        pending = undefined;
      }
    })();
    return pending;
  };

  const recheck = () => { void validate(); };
  browser.addEventListener("focus", recheck);
  browser.addEventListener("online", recheck);
  browser.document.addEventListener("visibilitychange", recheck);
  const interval = browser.setInterval(recheck, 60_000);
  recheck();

  return {
    validate,
    dispose: () => {
      disposed = true;
      subscription.unsubscribe();
      browser.clearInterval(interval);
      browser.removeEventListener("focus", recheck);
      browser.removeEventListener("online", recheck);
      browser.document.removeEventListener("visibilitychange", recheck);
    },
  };
}
