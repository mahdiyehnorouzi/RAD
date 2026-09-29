"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@rad/types";
import {
  findIndexEntry,
  type CatalogIndexEntry,
} from "@/lib/catalog/catalog-index";

type CatalogIndexValue = {
  find: (
    key: string | number | null | undefined,
  ) => CatalogIndexEntry | undefined;
  /** A work's title in `locale`, or `""` when the slug is unknown. */
  nameOf: (slug: string | null | undefined, locale: Locale) => string;
};

const CatalogIndexContext = createContext<CatalogIndexValue | null>(null);

/** Names and numbers of every work, for the chrome shared by all pages. */
export function CatalogIndexProvider({
  entries,
  children,
}: {
  entries: CatalogIndexEntry[];
  children: React.ReactNode;
}) {
  const value = useMemo<CatalogIndexValue>(() => {
    const find = (key: string | number | null | undefined) =>
      findIndexEntry(entries, key);
    return {
      find,
      nameOf: (slug, locale) => (slug ? (find(slug)?.title[locale] ?? "") : ""),
    };
  }, [entries]);

  return (
    <CatalogIndexContext.Provider value={value}>
      {children}
    </CatalogIndexContext.Provider>
  );
}

export function useCatalogIndex() {
  const value = useContext(CatalogIndexContext);
  if (!value)
    throw new Error("useCatalogIndex must be used inside CatalogIndexProvider");
  return value;
}
