"use client";

import { SlidersHorizontal } from "lucide-react";
import { useLocale } from "@/components/i18n";

export function CatalogBar({
  count,
  filtersOpen,
  activeFilters,
  panelId,
  onToggleFilters,
}: {
  count: number;
  filtersOpen: boolean;
  activeFilters: number;
  panelId: string;
  onToggleFilters: () => void;
}) {
  const { t, locale, number } = useLocale();
  return (
    <div className="plp-bar">
      <button
        type="button"
        className="plp-filters-toggle"
        aria-expanded={filtersOpen}
        aria-haspopup="dialog"
        aria-controls={filtersOpen ? panelId : undefined}
        onClick={onToggleFilters}
      >
        <SlidersHorizontal aria-hidden="true" />
        {locale === "fa" ? "فیلتر و مرتب‌سازی" : "Filter and sort"}
        {activeFilters ? (
          <span
            className="plp-filters-count"
            aria-label={t("filtersActive", { count: number(activeFilters) })}
          >
            {number(activeFilters)}
          </span>
        ) : null}
      </button>
      <span className="plp-count" aria-live="polite">
        {t("worksCount", { count: number(count) })}
      </span>
    </div>
  );
}
