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
    <div className="my-4 grid gap-1.5 py-2">
      <div className="flex w-full items-center justify-between gap-2">
        <b className="text-[0.82rem] font-medium">{t("artworkCategoriesHeading")}</b>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[0.7rem] text-rad-muted">
          {t("swipeToSeeMore")}
          {locale === "fa" ? <MoveLeft aria-hidden="true" /> : <MoveRight aria-hidden="true" />}
        </span>
      </div>
      <div className="relative min-w-0 overflow-hidden after:pointer-events-none after:absolute after:inset-y-0 after:end-0 after:z-[2] after:w-10 after:bg-gradient-to-l after:from-rad-canvas">
        <div
          className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain pb-1.5 [scrollbar-width:thin]"
          tabIndex={0}
          aria-label={t("filterCategoriesAria")}
        >
          {filters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={`min-h-[42px] shrink-0 snap-start whitespace-nowrap rounded-full border px-3.5 py-2 ${
                active === filter.id
                  ? "border-rad-clay bg-rad-clay text-rad-paper"
                  : "border-rad-line bg-rad-paper"
              }`}
              onClick={() => onChange(filter.id)}
              aria-pressed={active === filter.id}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <span className="pt-1 text-start">
        {number(count)} {t("availableWorks")}
      </span>
    </div>
  );
}
