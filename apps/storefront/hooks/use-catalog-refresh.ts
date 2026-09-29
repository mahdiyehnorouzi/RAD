"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback } from "react";
import { refreshCatalog } from "@/lib/catalog/actions";

/** Expires the server's catalog copy, then re-renders the page with fresh statuses. */
export function useCatalogRefresh() {
  const router = useRouter();
  return useCallback(async () => {
    await refreshCatalog().catch(() => {});
    startTransition(() => router.refresh());
  }, [router]);
}
