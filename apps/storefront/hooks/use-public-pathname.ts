"use client";

import { usePathname } from "next/navigation";
import { publicPathname } from "@/lib/locale";

/**
 * The path visitors see. During SSR `usePathname()` returns the internal
 * `/fa/...` URL that `proxy.ts` rewrote to, so compare against this instead.
 */
export function usePublicPathname() {
  return publicPathname(usePathname());
}
