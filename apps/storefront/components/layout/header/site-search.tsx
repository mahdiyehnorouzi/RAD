"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { productCopy } from "@/lib/catalog/products";
import { useLocale } from "@/components/i18n";
import { Search, X } from "lucide-react";
import { useSearchWorks } from "@/hooks/use-search-works";
import "./site-search.css";

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { locale, t, href } = useLocale();
  const { normalizedQuery, results } = useSearchWorks(query);
  const allResultsHref = href(
    `/products?q=${encodeURIComponent(query.trim())}`,
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
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            queueMicrotask(() =>
              window.dispatchEvent(
                new CustomEvent("rad:header-overlay", { detail: "search" }),
              ),
            );
          }
        }}
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
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !normalizedQuery) return;
                event.preventDefault();
                setOpen(false);
                router.push(allResultsHref);
              }}
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
              <Link
                className="search-all-results"
                href={allResultsHref}
                onClick={() => setOpen(false)}
              >
                {t("seeAllResults")}
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
