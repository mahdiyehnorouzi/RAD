"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownUp,
  Box,
  ChevronDown,
  SlidersHorizontal,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { CatalogArtist } from "@/lib/catalog/refine";
import type { CatalogFilters, StatusFilter } from "@/lib/catalog/filters";
import { priceRanges, sortOptions } from "../const";
import "./catalog-filters.css";

export function CatalogFilterPanel({
  id,
  filters,
  artists,
  onChange,
  onClose,
}: {
  id: string;
  filters: CatalogFilters;
  artists: CatalogArtist[];
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClose: () => void;
}) {
  const { t, locale, number } = useLocale();
  const [draft, setDraft] = useState(filters);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const change = (patch: Partial<CatalogFilters>) =>
    setDraft((current) => ({ ...current, ...patch }));
  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);
  const statusOptions: { id: StatusFilter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "available", label: t("filterAvailable") },
    { id: "sold", label: t("filterSold") },
    { id: "upcoming", label: t("filterUpcoming") },
  ];
  const artistOptions = [...artists].sort((a, b) =>
    a.name[locale].localeCompare(b.name[locale], locale),
  );
  const artistKnown =
    draft.artist === "all" ||
    artistOptions.some((artist) => artist.key === draft.artist);
  const anyPrice = draft.minPrice === null && draft.maxPrice === null;
  const preset = priceRanges.find(
    (range) => range.min === draft.minPrice && range.max === draft.maxPrice,
  );
  const toman = (value: number) =>
    locale === "fa" ? `${number(value)} تومان` : `${number(value)} toman`;
  const customPriceLabel =
    draft.minPrice !== null && draft.maxPrice !== null
      ? t("priceBetween", {
          min: toman(draft.minPrice),
          max: toman(draft.maxPrice),
        })
      : draft.minPrice !== null
        ? t("priceFrom", { min: toman(draft.minPrice) })
        : t("priceUpTo", { max: toman(draft.maxPrice ?? 0) });
  const title = locale === "fa" ? "فیلتر و مرتب‌سازی" : "Filter and sort";

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className="plp-filter-sheet"
      aria-labelledby={`${id}-title`}
      dir={locale === "fa" ? "rtl" : "ltr"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <div className="plp-sheet-handle" aria-hidden="true" />
      <header className="plp-sheet-head">
        <h2 id={`${id}-title`}>{title}</h2>
        <button type="button" onClick={onClose} aria-label={t("closeMenu")}>
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="plp-sheet-fields">
        <fieldset className="plp-sheet-group">
          <legend>
            <ArrowDownUp aria-hidden="true" />
            {t("sortHeading")}
          </legend>
          <div className="plp-sheet-options">
            {sortOptions.map((option) => (
              <label className="plp-sheet-option" key={option.id}>
                <input
                  type="radio"
                  name={`${id}-sort`}
                  checked={draft.sort === option.id}
                  onChange={() => change({ sort: option.id })}
                />
                <span>{t(option.labelKey)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="plp-sheet-group">
          <legend>
            <Box aria-hidden="true" />
            {t("availabilityHeading")}
          </legend>
          <div className="plp-sheet-options">
            {statusOptions.map((option) => (
              <label className="plp-sheet-option" key={option.id}>
                <input
                  type="radio"
                  name={`${id}-status`}
                  checked={draft.status === option.id}
                  onChange={() => change({ status: option.id })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="plp-sheet-group">
          <legend>
            <Tag aria-hidden="true" />
            {t("priceHeading")}
          </legend>
          <div className="plp-sheet-options plp-sheet-prices">
            <label className="plp-sheet-option">
              <input
                type="radio"
                name={`${id}-price`}
                checked={anyPrice}
                onChange={() => change({ minPrice: null, maxPrice: null })}
              />
              <span>{t("allPrices")}</span>
            </label>
            {priceRanges.map((range) => (
              <label className="plp-sheet-option" key={range.id}>
                <input
                  type="radio"
                  name={`${id}-price`}
                  checked={preset?.id === range.id}
                  onChange={() =>
                    change({ minPrice: range.min, maxPrice: range.max })
                  }
                />
                <span>{range.label[locale]}</span>
              </label>
            ))}
            {!anyPrice && !preset ? (
              <label className="plp-sheet-option">
                <input type="radio" name={`${id}-price`} checked readOnly />
                <span>{customPriceLabel}</span>
              </label>
            ) : null}
          </div>
        </fieldset>
        <div className="plp-sheet-group">
          <label className="plp-sheet-label" htmlFor={`${id}-artist`}>
            <UserRound aria-hidden="true" />
            {t("artistHeading")}
          </label>
          <div className="plp-sheet-select">
            <select
              id={`${id}-artist`}
              value={draft.artist}
              onChange={(event) => change({ artist: event.target.value })}
            >
              <option value="all">{t("allArtists")}</option>
              {artistOptions.map((artist) => (
                <option key={artist.key} value={artist.key}>
                  {artist.name[locale]}
                </option>
              ))}
              {!artistKnown ? (
                <option value={draft.artist}>{draft.artist}</option>
              ) : null}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
        </div>
      </div>
      <footer className="plp-sheet-footer">
        <button
          type="button"
          className="plp-sheet-apply"
          onClick={() => {
            onChange(draft);
            onClose();
          }}
        >
          <SlidersHorizontal aria-hidden="true" />
          {locale === "fa" ? "نمایش آثار" : "Show works"}
        </button>
        <button
          type="button"
          className="plp-sheet-clear"
          onClick={() =>
            change({
              sort: "newest",
              status: "all",
              minPrice: null,
              maxPrice: null,
              artist: "all",
            })
          }
        >
          {locale === "fa" ? "پاک کردن" : "Clear"}
        </button>
      </footer>
    </dialog>
  );
}
