"use client";

import { MoveLeft, MoveRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { artworkCategories } from "@/lib/catalog/artwork";

export function CatalogFilters({
  active,
  onChange,
  count,
}: {
  active: string;
  onChange: (id: string) => void;
  count: number;
}) {
  const { t, number, locale } = useLocale();
  const filters = [
    { id: "all", label: t("filterAll") },
    ...artworkCategories.map((category) => ({
      id: category.id,
      label: category.label[locale],
    })),
  ];

  return (
    <div className="filterbar">
      <div className="filter-heading">
        <b>{t("artworkCategoriesHeading")}</b>
        <span className="filter-scroll-hint">
          {t("swipeToSeeMore")}
          {locale === "fa" ? <MoveLeft aria-hidden="true" /> : <MoveRight aria-hidden="true" />}
        </span>
      </div>
      <div className="filter-scroll-shell">
        <div
          className="filter-scroll"
          tabIndex={0}
          aria-label={t("filterCategoriesAria")}
        >
          {filters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={active === filter.id ? "active" : ""}
              onClick={() => onChange(filter.id)}
              aria-pressed={active === filter.id}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <span className="filter-count">
        {number(count)} {t("availableWorks")}
      </span>
    </div>
  );
}
