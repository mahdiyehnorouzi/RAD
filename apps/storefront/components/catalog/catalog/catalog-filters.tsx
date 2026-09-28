"use client";

import { ChevronDown } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { CatalogArtist } from "@/lib/catalog/refine";
import type { CatalogFilters, StatusFilter } from "@/lib/catalog/filters";
import { priceRanges } from "../const";

export function CatalogFilterPanel({
  id,
  open,
  filters,
  activeCount,
  artists,
  onChange,
  onClear,
}: {
  id: string;
  open: boolean;
  filters: CatalogFilters;
  /** Refinements owned by this panel; the category chips are outside it. */
  activeCount: number;
  artists: CatalogArtist[];
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClear: () => void;
}) {
  const { t, locale, number } = useLocale();
  const statusOptions: { id: StatusFilter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "available", label: t("filterAvailable") },
    { id: "upcoming", label: t("filterUpcoming") },
    { id: "sold", label: t("filterSold") },
  ];
  const artistOptions = [...artists].sort((a, b) =>
    a.name[locale].localeCompare(b.name[locale], locale),
  );
  const artistKnown =
    filters.artist === "all" ||
    artistOptions.some((artist) => artist.key === filters.artist);

  const anyPrice = filters.minPrice === null && filters.maxPrice === null;
  const preset = priceRanges.find(
    (range) => range.min === filters.minPrice && range.max === filters.maxPrice,
  );
  const toman = (value: number) =>
    locale === "fa" ? `${number(value)} تومان` : `${number(value)} toman`;
  const customPriceLabel =
    filters.minPrice !== null && filters.maxPrice !== null
      ? t("priceBetween", {
          min: toman(filters.minPrice),
          max: toman(filters.maxPrice),
        })
      : filters.minPrice !== null
        ? t("priceFrom", { min: toman(filters.minPrice) })
        : t("priceUpTo", { max: toman(filters.maxPrice ?? 0) });

  return (
    <div id={id} className="plp-filters" data-open={open} inert={!open}>
      <div className="plp-filters-inner">
        <div className="plp-filters-body">
          <fieldset className="plp-filter-group">
            <legend>{t("availabilityHeading")}</legend>
            <div className="catalog-segment">
              {statusOptions.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={filters.status === item.id ? "active" : ""}
                  data-status={item.id}
                  aria-pressed={filters.status === item.id}
                  onClick={() => onChange({ status: item.id })}
                >
                  <i aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="plp-filter-group">
            <label htmlFor="catalog-artist">{t("artistHeading")}</label>
            <div
              className="plp-select"
              data-active={filters.artist !== "all" || undefined}
            >
              <select
                id="catalog-artist"
                value={filters.artist}
                onChange={(event) => onChange({ artist: event.target.value })}
              >
                <option value="all">{t("allArtists")}</option>
                {artistOptions.map((artist) => (
                  <option key={artist.key} value={artist.key}>
                    {artist.name[locale]} ({number(artist.count)})
                  </option>
                ))}
                {artistKnown ? null : (
                  <option value={filters.artist}>{filters.artist}</option>
                )}
              </select>
              <ChevronDown aria-hidden="true" />
            </div>
          </div>

          <fieldset className="plp-filter-group">
            <legend>{t("priceHeading")}</legend>
            <div className="plp-choice-row">
              <button
                type="button"
                className="plp-choice"
                aria-pressed={anyPrice}
                onClick={() => onChange({ minPrice: null, maxPrice: null })}
              >
                {t("allPrices")}
              </button>
              {priceRanges.map((range) => (
                <button
                  type="button"
                  key={range.id}
                  className="plp-choice"
                  aria-pressed={preset?.id === range.id}
                  onClick={() =>
                    onChange({ minPrice: range.min, maxPrice: range.max })
                  }
                >
                  {range.label[locale]}
                </button>
              ))}
              {!anyPrice && !preset ? (
                <button type="button" className="plp-choice" aria-pressed>
                  {customPriceLabel}
                </button>
              ) : null}
            </div>
          </fieldset>

          {activeCount ? (
            <button type="button" className="catalog-clear" onClick={onClear}>
              {t("clearFilters")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
