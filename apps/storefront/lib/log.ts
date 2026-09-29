import { unstable_rethrow } from "next/navigation";

// Browsers only log in development: offline visitors would otherwise see a warning per poll.
const enabled =
  typeof window === "undefined" || process.env.NODE_ENV !== "production";

/**
 * Records a failure the page recovers from (fallback data, a later retry), so
 * the reason shows up in server logs and the dev console instead of vanishing.
 * Next.js control-flow errors (dynamic bailout, notFound, redirect) are rethrown.
 */
export function logRecovered(scope: string, error: unknown) {
  unstable_rethrow(error);
  if (enabled) console.warn(`[rad:${scope}]`, error);
}

/** For `.catch(recover("scope", fallback))`: logs the failure, then resolves to `fallback`. */
export function recover<T>(scope: string, fallback: T) {
  return (error: unknown): T => {
    logRecovered(scope, error);
    return fallback;
  };
}
