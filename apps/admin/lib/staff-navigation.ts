import type { AdminSection } from "./admin-data";

export function isReviewsPath(pathname: string) {
  return pathname === "/reviews" || pathname.startsWith("/reviews/");
}

export function isHelpPath(pathname: string) {
  return pathname === "/help" || pathname.startsWith("/help/");
}

export function isMessagesPath(pathname: string) {
  return pathname === "/messages" || pathname.startsWith("/messages/");
}

type StudioRoute = "reviews" | "help" | "messages";

const studioPath: Record<StudioRoute, string> = {
  reviews: "/reviews",
  help: "/help",
  messages: "/messages",
};

/** Independent studio routes. Every other section still lives on `/`. */
function studioRoute(pathname: string): StudioRoute | null {
  if (isReviewsPath(pathname)) return "reviews";
  if (isHelpPath(pathname)) return "help";
  if (isMessagesPath(pathname)) return "messages";
  return null;
}

/** Sidebar href for a section that has left `/`. Null for dashboard sections. */
export function studioNavHref(section: StudioRoute) {
  return studioPath[section];
}

/**
 * Data to load for the URL the user is actually on. `/reviews`, `/help`,
 * and `/messages` stay those sections even when the in-memory dashboard
 * section is something else. Every other section still lives on `/`.
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
 * Explicit nav choice. Reviews, Help, and Messages keep the previous
 * dashboard section in memory. Overview, Orders, and every other `/`
 * section replace that memory. Choosing the section already on screen
 * does not fetch.
 */
export function planSectionSelect(
  current: StudioView,
  next: AdminSection,
): NavigationPlan {
  if (next === "reviews" || next === "help" || next === "messages") {
    const pathname = studioPath[next];
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
 * Back from Reviews, Help, or Messages returns to whatever `/` was
 * showing. A pop that does not change the path does not fetch.
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
  if (route) return studioPath[route];
  return pathname;
}

/** Keep a commissions hash when replacing `/`. A studio route never carries it. */
export function studioHistoryHref(pathname: string, hash: string) {
  const path = normalizeStudioPath(pathname);
  if (path !== "/" || hash === "") return path;
  return `/${hash.startsWith("#") ? hash : `#${hash}`}`;
}

export type PendingNavigation = {
  pathname: string;
  section: AdminSection;
  load: AdminSection | null;
  /** Set only on the navigation from Messages to Orders. Not copied onto a later choice. */
  focusOrderId?: string;
};

/**
 * The order to reveal when this exact navigation commits on `/`.
 * A missing pending, or a pending choice that is not Orders, carries no id.
 */
export function withOrderFocus(
  pending: PendingNavigation | null,
  orderId: string,
): PendingNavigation | null {
  if (
    !pending ||
    normalizeStudioPath(pending.pathname) !== "/" ||
    pending.section !== "orders"
  ) {
    return pending;
  }
  return { ...pending, focusOrderId: orderId };
}

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

export type StudioLinkAction = {
  pending: PendingNavigation | null;
  skip: null;
  /**
   * The visible URL is already this route, but another choice has not
   * committed. Replace back to it so that older navigation cannot land
   * and leave its pending choice stuck.
   */
  replace: string | null;
};

/**
 * Reviews, Help, and Messages are links. Plan from the uncommitted choice
 * when one exists, so a second click does not treat the stale rendered URL
 * as current. The pathname effect performs the one fetch. `skip` stays null.
 */
function startStudioLink(
  visible: StudioView,
  route: StudioRoute,
  pending: PendingNavigation | null,
): StudioLinkAction {
  const current = pending
    ? { pathname: pending.pathname, section: pending.section }
    : visible;
  const pathname = studioPath[route];
  const visiblePath = normalizeStudioPath(visible.pathname);
  const inFlightElsewhere =
    pending !== null && normalizeStudioPath(pending.pathname) !== pathname;
  if (visiblePath === pathname && inFlightElsewhere) {
    return { pending: null, skip: null, replace: pathname };
  }
  return {
    pending: {
      pathname,
      section: current.section,
      load: normalizeStudioPath(current.pathname) === pathname ? null : route,
    },
    skip: null,
    replace: null,
  };
}

export function startReviewsLink(
  visible: StudioView,
  pending: PendingNavigation | null = null,
) {
  return startStudioLink(visible, "reviews", pending);
}

export function startHelpLink(
  visible: StudioView,
  pending: PendingNavigation | null = null,
) {
  return startStudioLink(visible, "help", pending);
}

export function startMessagesLink(
  visible: StudioView,
  pending: PendingNavigation | null = null,
) {
  return startStudioLink(visible, "messages", pending);
}

export type StudioAuth =
  "initializing" | "authenticated" | "unauthenticated" | "error";

export type PathSettle = {
  seen: string | null;
  skip: AdminSection | null;
  pending: PendingNavigation | null;
  section: AdminSection;
  load: AdminSection | null;
  /** Present only when the navigation that carried this id commits. */
  focusOrderId: string | null;
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
      focusOrderId: null,
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
      focusOrderId: null,
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
    focusOrderId:
      pathMatchesPending && pending?.focusOrderId ? pending.focusOrderId : null,
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
