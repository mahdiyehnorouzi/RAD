"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyCatalogFilters,
  type CatalogFilters,
} from "@/lib/catalog/filters";

/** Catalog state mirrored into the address bar so every view can be shared or bookmarked. */
export function useCatalogFilters(initial: CatalogFilters) {
  const [filters, setFilters] = useState(initial);

  const update = useCallback((patch: Partial<CatalogFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    applyCatalogFilters(url.searchParams, filters);
    if (url.href !== window.location.href) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [filters]);

  return { filters, update };
}
