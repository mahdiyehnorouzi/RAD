export type CartBackMode = "replay-history" | "fallback";

/**
 * Decides whether the cart page's Back control should replay in-app history
 * (`router.back()`) or fall back to a fixed destination.
 *
 * `hasNavigatedInApp` (see features/navigation/app-navigation.ts) is the one
 * signal that actually distinguishes "reached /cart by following a link on
 * this site" from a direct hit, a refresh, or an arrival from an external
 * link — unlike `window.history.length`, which also grows from cross-origin
 * history entries and from back/forward through earlier, unrelated visits
 * in the same tab, and unlike `document.referrer`, which common referrer
 * policies strip and which stays same-origin after an external redirect.
 */
export function resolveCartBackMode(hasNavigatedInApp: boolean): CartBackMode {
  return hasNavigatedInApp ? "replay-history" : "fallback";
}
