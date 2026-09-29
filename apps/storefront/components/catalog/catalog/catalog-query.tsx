"use client";

import { Search, X } from "lucide-react";
import { useLocale } from "@/components/i18n";

/** The words searched from the header, shown so they can be cleared in place. */
export function CatalogQuery({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="plp-query" role="search" aria-label={t("catalogSearchLabel")}>
      <Search aria-hidden="true" />
      <span className="plp-query-text">
        {locale === "fa" ? `«${query}»` : `“${query}”`}
      </span>
      <button type="button" onClick={onClear} aria-label={t("clearSearch")}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
