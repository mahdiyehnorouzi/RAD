import type { OverlayStackEntry } from "./overlay-history";

const STACK_KEY = "rad-overlay-stack";

/**
 * The one place the open/related-work stack actually lives: `sessionStorage`,
 * not `window.history.state` - see overlay-history.ts for why. Swallows
 * read/write failures (private browsing, quota, disabled storage): the
 * worst case is a Back press just closes the overlay instead of retargeting
 * to an intermediate product, never a crash.
 */
export function readOverlayStack(): OverlayStackEntry[] {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeOverlayStack(stack: OverlayStackEntry[]): void {
  try {
    if (stack.length) sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));
    else sessionStorage.removeItem(STACK_KEY);
  } catch {
    // ignored - see readOverlayStack
  }
}
