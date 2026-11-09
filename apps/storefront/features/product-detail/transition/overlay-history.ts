export type OverlayStackEntry = { slug: string; href: string };

/**
 * The stack to push onto `open()`: either a fresh single-entry stack (the
 * overlay isn't currently open) or the current stack with one more entry
 * appended (opening a related work from inside an already-open overlay).
 * Kept in `sessionStorage` by the caller, not in `window.history.state` -
 * Next's own App Router also manages `history.state` for its own routing
 * purposes and has been observed to overwrite custom fields on it, so
 * nothing here can rely on a custom field surviving there untouched.
 */
export function nextOverlayStack(
  current: OverlayStackEntry[],
  entering: OverlayStackEntry,
  currentlyOverlaid: boolean,
): OverlayStackEntry[] {
  return currentlyOverlaid ? [...current, entering] : [entering];
}

/**
 * What a popstate while the overlay is mounted means, given the stack as it
 * stood immediately before this pop. Related-work navigation from inside an
 * already-open overlay pushes one more stack entry per hop (see
 * `nextOverlayStack`), so popping the top entry and finding another one
 * underneath it - via Back *or* Forward - means the overlay should retarget
 * to that product in place, never tear down. An empty result means we've
 * surfaced to the real underlying page the overlay was first opened from:
 * a genuine exit.
 */
export function popOverlayStack(
  current: OverlayStackEntry[],
):
  | { kind: "retarget"; stack: OverlayStackEntry[]; entry: OverlayStackEntry }
  | { kind: "close" } {
  const next = current.slice(0, -1);
  const top = next[next.length - 1];
  if (top) return { kind: "retarget", stack: next, entry: top };
  return { kind: "close" };
}
