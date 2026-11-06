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

/**
 * First dashboard section on `/`. `#commissions/<id>` is the only deep link,
 * and it is read when the shell first mounts (direct load or refresh).
 * The hash is not a route: a later edit does not change the section.
 */
export function initialDashboardSection(hash: string): AdminSection {
  return hash.startsWith("#commissions/") ? "commissions" : "overview";
}

export type StudioView = {
  pathname: string;
  section: AdminSection;
};

export type NavigationPlan = {
  view: StudioView;
  /** Null when this transition must not fetch. `loadSection` also no-ops if that resource is already loaded or in flight. */
  load: AdminSection | null;
};

/**
 * Explicit nav choice. Reviews keeps the previous dashboard section in
 * memory. Overview, Orders, Messages, and every other `/` section replace
 * that memory. Choosing the section already on screen does not fetch.
 */
export function planSectionSelect(
  current: StudioView,
  next: AdminSection,
): NavigationPlan {
  if (next === "reviews") {
    if (isReviewsPath(current.pathname)) return { view: current, load: null };
    return {
      view: { pathname: "/reviews", section: current.section },
      load: "reviews",
    };
  }
  const view = { pathname: "/", section: next };
  const unchanged = current.pathname === "/" && current.section === next;
  return { view, load: unchanged ? null : next };
}

/**
 * Browser Back/Forward or a `<Link>`. The in-memory section is kept, so
 * Back from Reviews returns to whatever `/` was showing. A pop that does
 * not change the path does not fetch.
 */
export function planHistoryNavigation(
  current: StudioView,
  pathname: string,
): NavigationPlan {
  if (
    pathname === current.pathname ||
    (isReviewsPath(pathname) && isReviewsPath(current.pathname))
  ) {
    return { view: { ...current, pathname }, load: null };
  }
  const view = { pathname, section: current.section };
  return { view, load: sectionDataTarget(pathname, current.section) };
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
