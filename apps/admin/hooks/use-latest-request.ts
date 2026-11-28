import { useCallback, useMemo, useRef } from "react";

/**
 * Guards against an older, slower async request overwriting state after a
 * newer one has already started — the "ignore stale responses" half of
 * a search-as-you-type race condition (the other half, not firing a
 * request per keystroke in the first place, is `useDebouncedValue`).
 *
 * Call `begin()` right before starting a request, and only apply its
 * result if `isLatest(id)` is still true once it resolves — a later
 * `begin()` call (a newer request starting, for any reason: a faster
 * keystroke, a filter change, …) permanently invalidates every earlier id.
 *
 * `begin`/`isLatest` keep the same identity for the lifetime of the
 * component (each wrapped in its own `useCallback` with no dependencies —
 * only the ref they close over is read, never during render), so they're
 * safe to leave out of a `useCallback`/`useEffect` dependency array the
 * same way a plain ref would be.
 */
export function useLatestRequest() {
  const latest = useRef(0);
  const begin = useCallback((): number => ++latest.current, []);
  const isLatest = useCallback(
    (id: number): boolean => id === latest.current,
    [],
  );
  return useMemo(() => ({ begin, isLatest }), [begin, isLatest]);
}
