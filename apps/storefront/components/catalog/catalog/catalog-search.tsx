"use client";

import { Search, X } from "lucide-react";
import { useLocale } from "@/components/i18n";

export function CatalogSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="catalog-search" role="search">
      <Search aria-hidden="true" />
      <label className="sr-only" htmlFor="catalog-search-input">
        {t("catalogSearchLabel")}
      </label>
      <input
        id="catalog-search-input"
        type="search"
        inputMode="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        autoComplete="off"
        maxLength={80}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("clearSearch")}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
