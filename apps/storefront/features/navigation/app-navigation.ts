/**
 * Tracks whether this tab has completed at least one client-side route
 * change (an in-app Link/router.push), as opposed to the current page
 * being the first thing this tab loaded — a direct hit, a refresh, or an
 * arrival from an external link.
 *
 * Module state, read and written only from client-side effects (never from
 * a render body — see AppNavigationTracker and any reader): a hard
 * reload/refresh re-runs this module from scratch, so the flag resets by
 * construction. That's what makes it reliable where `window.history.length`
 * is not — history.length also grows from cross-origin entries and
 * back/forward through unrelated tabs/sessions — and where
 * `document.referrer` is not either, since it's stripped by common
 * referrer policies and still same-origin after an external redirect.
 */
let navigatedInApp = false;

export function markAppNavigation() {
  navigatedInApp = true;
}

export function hasNavigatedInApp(): boolean {
  return navigatedInApp;
}

/** Test-only: restore the module's initial state between test cases. */
export function resetAppNavigationForTesting() {
  navigatedInApp = false;
}

/**
 * Whether AppNavigationTracker should mark this pathname change as a
 * genuine in-app navigation. Pulled out as a pure predicate so the "first
 * render never counts" rule (the direct-hit/refresh/external-link case) is
 * testable without mounting the tracker.
 */
export function shouldMarkNavigation(
  previousPathname: string,
  nextPathname: string,
): boolean {
  return previousPathname !== nextPathname;
}
