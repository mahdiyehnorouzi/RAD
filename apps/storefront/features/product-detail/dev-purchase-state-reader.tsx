"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDevPurchaseOverride } from "./hooks";
import type { PurchaseState } from "./type";

/**
 * Isolates the two `useSearchParams()`-dependent dev-QA hooks into their own
 * small subtree, mounted by the parent only when `isDev`. Keeping them out
 * of `ProductDetail` itself means production never touches
 * `useSearchParams()` here at all — satisfying rules-of-hooks (every hook
 * this component calls runs unconditionally on each of *its own* renders)
 * without tripping Next's "missing Suspense boundary" static-render bailout
 * for a hook production never reaches. The parent still wraps this in its
 * own `<Suspense>` as the belt-and-braces Next.js asks for.
 */
export function DevPurchaseStateReader({
  onChange,
}: {
  onChange: (
    override: Partial<PurchaseState> | null,
    devState: string | null,
  ) => void;
}) {
  const override = useDevPurchaseOverride();
  const devState = useSearchParams().get("__devState");
  useEffect(() => {
    onChange(override, devState);
  }, [override, devState, onChange]);
  return null;
}
