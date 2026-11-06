import type { AdminSection } from "./admin-data";

export function isReviewsPath(pathname: string) {
  return pathname === "/reviews" || pathname.startsWith("/reviews/");
}

export function isHelpPath(pathname: string) {
  return pathname === "/help" || pathname.startsWith("/help/");
}

/** Independent studio routes. Every other section still lives on `/`. */
function studioRoute(pathname: string): "reviews" | "help" | null {
  if (isReviewsPath(pathname)) return "reviews";
  if (isHelpPath(pathname)) return "help";
  return null;
}

/**
 * Data to load for the URL the user is actually on. `/reviews` and `/help`
 * stay those sections even when the in-memory dashboard section is
 * something else. Every other section still lives on `/`.
 */
export function sectionDataTarget(
  pathname: string,
  section: AdminSection,
): AdminSection {
  return studioRoute(pathname) ?? section;
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
 * Explicit nav choice. Reviews and Help keep the previous dashboard
 * section in memory. Overview, Orders, Messages, and every other `/`
 * section replace that memory. Choosing the section already on screen
 * does not fetch.
 */
export function planSectionSelect(
  current: StudioView,
  next: AdminSection,
): NavigationPlan {
  if (next === "reviews" || next === "help") {
    const pathname = next === "reviews" ? "/reviews" : "/help";
    if (normalizeStudioPath(current.pathname) === pathname) {
      return { view: current, load: null };
    }
    return {
      view: { pathname, section: current.section },
      load: next,
    };
  }
  const view = { pathname: "/", section: next };
  const unchanged = current.pathname === "/" && current.section === next;
  return { view, load: unchanged ? null : next };
}

/**
 * Browser Back/Forward or a `<Link>`. The in-memory section is kept, so
 * Back from Reviews or Help returns to whatever `/` was showing. A pop
 * that does not change the path does not fetch.
 */
export function planHistoryNavigation(
  current: StudioView,
  pathname: string,
): NavigationPlan {
  const nextRoute = studioRoute(pathname);
  const currentRoute = studioRoute(current.pathname);
  if (
    pathname === current.pathname ||
    (nextRoute !== null && nextRoute === currentRoute)
  ) {
    return { view: { ...current, pathname }, load: null };
  }
  const view = { pathname, section: current.section };
  return { view, load: sectionDataTarget(pathname, current.section) };
}

export function normalizeStudioPath(pathname: string) {
  const route = studioRoute(pathname);
  if (route === "reviews") return "/reviews";
  if (route === "help") return "/help";
  return pathname;
}

/** Keep a commissions hash when replacing `/`. A reviews or help URL never carries it. */
export function studioHistoryHref(pathname: string, hash: string) {
  const path = normalizeStudioPath(pathname);
  if (path === "/reviews" || path === "/help" || hash === "") return path;
  return `/${hash.startsWith("#") ? hash : `#${hash}`}`;
}

export type PendingNavigation = {
  pathname: string;
  section: AdminSection;
  load: AdminSection | null;
};

export type SectionSelectAction = {
  pending: PendingNavigation | null;
  section: AdminSection;
  push: string | null;
  replace: string | null;
  skip: AdminSection | null;
  load: AdminSection | null;
};

/**
 * Explicit choice. `pending` is the latest choice whose URL has not committed,
 * so a second click does not plan against a stale pathname. The section state
 * changes immediately only when the visible URL is already the destination.
 */
export function startSectionSelect(
  visible: StudioView,
  pending: PendingNavigation | null,
  next: AdminSection,
): SectionSelectAction {
  const plan = planSectionSelect(
    pending
      ? { pathname: pending.pathname, section: pending.section }
      : visible,
    next,
  );
  const dest = normalizeStudioPath(plan.view.pathname);
  const visiblePath = normalizeStudioPath(visible.pathname);
  const inFlightElsewhere =
    pending !== null && normalizeStudioPath(pending.pathname) !== dest;
  if (visiblePath === dest && !inFlightElsewhere) {
    return {
      pending: null,
      section: plan.view.section,
      push: null,
      replace: null,
      skip: null,
      load: plan.load,
    };
  }
  if (visiblePath === dest && inFlightElsewhere) {
    return {
      pending: null,
      section: plan.view.section,
      push: null,
      replace: dest,
      skip: null,
      load: plan.load,
    };
  }
  return {
    pending: { pathname: dest, section: plan.view.section, load: plan.load },
    section: visible.section,
    push: dest,
    replace: null,
    skip: plan.load,
    load: plan.load,
  };
}

/**
 * Reviews and Help are links. Each keeps the dashboard section and clears
 * a stale skip. The pathname effect performs the one fetch.
 */
function startStudioLink(
  visible: StudioView,
  route: "reviews" | "help",
): { pending: PendingNavigation; skip: null } {
  const pathname = route === "reviews" ? "/reviews" : "/help";
  return {
    pending: {
      pathname,
      section: visible.section,
      load: normalizeStudioPath(visible.pathname) === pathname ? null : route,
    },
    skip: null,
  };
}

export function startReviewsLink(visible: StudioView) {
  return startStudioLink(visible, "reviews");
}

export function startHelpLink(visible: StudioView) {
  return startStudioLink(visible, "help");
}

export type StudioAuth =
  "initializing" | "authenticated" | "unauthenticated" | "error";

export type PathSettle = {
  seen: string | null;
  skip: AdminSection | null;
  pending: PendingNavigation | null;
  section: AdminSection;
  load: AdminSection | null;
};

export function sectionForCommittedPath(
  pathname: string,
  section: AdminSection,
  pending: PendingNavigation | null,
): AdminSection {
  if (
    pending &&
    normalizeStudioPath(pathname) === normalizeStudioPath(pending.pathname)
  ) {
    return pending.section;
  }
  return section;
}

/**
 * Pathname or auth effect. A signed-out or failed session drops skip and
 * pending: logout clears loaded data, so a leftover skip must not hide the
 * next session's fetch. A pending choice is applied only when its URL commits.
 */
export function settleStudioPath(input: {
  auth: StudioAuth;
  pathname: string;
  section: AdminSection;
  seen: string | null;
  skip: AdminSection | null;
  pending: PendingNavigation | null;
}): PathSettle {
  if (input.auth !== "authenticated") {
    return {
      seen: input.seen,
      skip: null,
      pending: null,
      section: input.section,
      load: null,
    };
  }
  const pending = input.pending;
  const pathMatchesPending =
    pending !== null &&
    normalizeStudioPath(input.pathname) ===
      normalizeStudioPath(pending.pathname);
  if (pending && !pathMatchesPending) {
    return {
      seen: input.seen,
      skip: input.skip,
      pending,
      section: input.section,
      load: null,
    };
  }
  const section = sectionForCommittedPath(
    input.pathname,
    input.section,
    pending,
  );
  const previous = input.seen;
  const load =
    previous === null || previous === input.pathname
      ? sectionDataTarget(input.pathname, section)
      : planHistoryNavigation({ pathname: previous, section }, input.pathname)
          .load;
  return {
    seen: input.pathname,
    skip: null,
    pending: null,
    section,
    load: load && input.skip !== load ? load : null,
  };
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
