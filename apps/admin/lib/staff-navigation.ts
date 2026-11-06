import type { AdminSection } from "./admin-data";

export function isReviewsPath(pathname: string) {
  return pathname === "/reviews" || pathname.startsWith("/reviews/");
}

/**
 * Data to load for the URL the user is actually on. `/reviews` is the
 * reviews section even when the in-memory dashboard section is something
 * else. Every other section still lives on `/`.
 */
export function sectionDataTarget(
  pathname: string,
  section: AdminSection,
): AdminSection {
  return isReviewsPath(pathname) ? "reviews" : section;
}

/** First dashboard section on `/`. The commissions hash is the only deep link. */
export function initialDashboardSection(hash: string): AdminSection {
  return hash.startsWith("#commissions/") ? "commissions" : "overview";
}

export type StaffGate = "loading" | "error" | "login" | "app";

/**
 * Same gate as the dashboard shell: session restore is not logged-out,
 * a failed restore is retryable, and a session without an admin role
 * sees the login screen.
 */
export function staffGate(
  authStatus: "initializing" | "authenticated" | "unauthenticated" | "error",
  hasAdminRole: boolean,
): StaffGate {
  if (authStatus === "initializing") return "loading";
  if (authStatus === "error") return "error";
  if (!hasAdminRole) return "login";
  return "app";
}
