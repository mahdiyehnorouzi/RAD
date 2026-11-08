/**
 * Decides whether the cart page's Back control should replay in-app history
 * (`router.back()`) or fall back to a fixed destination. `history.length`
 * only grows on same-tab in-app navigation, so a direct hit (refresh,
 * bookmark, shared link) always reports 1 — the one entry for this load —
 * while following a link from elsewhere on the site reports more than 1.
 */
export function shouldReplayHistory(historyLength: number): boolean {
  return historyLength > 1;
}
