"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback } from "react";
import { refreshCatalog } from "@/lib/catalog/actions";
import { logRecovered } from "@/lib/log";

/** Expires the server's catalog copy, then re-renders the page with fresh statuses. */
export function useCatalogRefresh() {
  const router = useRouter();
  return useCallback(async () => {
    await refreshCatalog().catch((error) =>
      logRecovered("catalog refresh", error),
    );
    startTransition(() => router.refresh());
  }, [router]);
}
