"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { productCopy } from "@/lib/catalog";
import { useLocale } from "@/components/i18n";
import { Search, X } from "lucide-react";
import { useCatalog } from "@/components/catalog";

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const { locale, t, href } = useLocale();
  const { products } = useCatalog();
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);

  const results = useMemo(
    () =>
      normalizedQuery
        ? products.filter((product) => {
            const copy = productCopy(product, locale);
            return `${copy.name} ${copy.subtitle} ${copy.story}`
              .toLocaleLowerCase(locale)
              .includes(normalizedQuery);
          })
        : [],
    [locale, normalizedQuery, products],
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    const close = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== "search") setOpen(false);
    };
    window.addEventListener("rad:header-overlay", close);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("rad:header-overlay", close);
    };
  }, []);

  return (
    <div className="site-search">
      <button
        className="search-toggle"
        type="button"
        onClick={() =>
          setOpen((current) => {
            const next = !current;
            if (next)
              window.dispatchEvent(
                new CustomEvent("rad:header-overlay", { detail: "search" }),
              );
            return next;
          })
        }
        aria-expanded={open}
        aria-controls="site-search-panel"
        aria-label={open ? t("closeSearch") : t("searchAria")}
      >
        <Search aria-hidden="true" />
      </button>
      {open && (
        <section id="site-search-panel" className="search-panel">
          <div className="search-field">
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="site-search-input">
              {t("searchAria")}
            </label>
            <input
              ref={inputRef}
              id="site-search-input"
              type="text"
              role="searchbox"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>
          {normalizedQuery && (
            <div className="search-results" aria-live="polite">
              <b>{t("searchResults")}</b>
              {results.length ? (
                <ul>
                  {results.map((product) => {
                    const copy = productCopy(product, locale);
                    return (
                      <li key={product.slug}>
                        <Link
                          href={href(`/products/${product.slug}`)}
                          onClick={() => setOpen(false)}
                        >
                          <span>{copy.name}</span>
                          <small>{copy.subtitle}</small>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>{t("searchEmpty")}</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
