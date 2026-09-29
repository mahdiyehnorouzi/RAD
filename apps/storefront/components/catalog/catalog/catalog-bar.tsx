"use client";

import { ChevronDown, Funnel } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { CatalogSort } from "@/lib/catalog/filters";
import { sortOptions } from "../const";

export function CatalogBar({
  count,
  sort,
  onSort,
  filtersOpen,
  activeFilters,
  panelId,
  onToggleFilters,
}: {
  count: number;
  sort: CatalogSort;
  onSort: (sort: CatalogSort) => void;
  filtersOpen: boolean;
  activeFilters: number;
  panelId: string;
  onToggleFilters: () => void;
}) {
  const { t, number } = useLocale();
  return (
    <div className="plp-bar">
      <div className="plp-bar-start">
        <button
          type="button"
          className="plp-filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls={panelId}
          onClick={onToggleFilters}
        >
          <Funnel aria-hidden="true" />
          {t("filtersButton")}
          {activeFilters ? (
            <span className="plp-filters-count">
              <span aria-hidden="true">{number(activeFilters)}</span>
              <span className="sr-only">
                {t("filtersActive", { count: number(activeFilters) })}
              </span>
            </span>
          ) : (
            <span className="plp-filters-dot" aria-hidden="true" />
          )}
        </button>
        <span className="plp-bar-rule" aria-hidden="true" />
        <span className="plp-count" aria-live="polite">
          {t("worksCount", { count: number(count) })}
        </span>
      </div>
      <div className="plp-sort">
        <label className="sr-only" htmlFor="catalog-sort">
          {t("sortHeading")}
        </label>
        <select
          id="catalog-sort"
          value={sort}
          onChange={(event) => onSort(event.target.value as CatalogSort)}
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" />
      </div>
    </div>
  );
}
