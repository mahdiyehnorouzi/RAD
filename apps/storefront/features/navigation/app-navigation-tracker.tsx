"use client";
import { useEffect, useRef } from "react";
import { usePublicPathname } from "@/hooks/use-public-pathname";
import { markAppNavigation, shouldMarkNavigation } from "./app-navigation";

/**
 * Mounted once in the root layout, which stays mounted across client-side
 * route changes (only the page segment under it swaps) — so this sees every
 * pathname the tab visits, not just the one it's rendered for. Marks every
 * change after the first render as a genuine in-app navigation; the first
 * render itself (whatever page this tab happened to load first) is never
 * marked, since that's exactly the "direct hit" case callers need to tell
 * apart. See app-navigation.ts for why this is tracked at all.
 */
export function AppNavigationTracker() {
  const pathname = usePublicPathname();
  const previous = useRef(pathname);
  useEffect(() => {
    if (shouldMarkNavigation(previous.current, pathname)) markAppNavigation();
    previous.current = pathname;
  }, [pathname]);
  return null;
}
