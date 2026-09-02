"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { productCopy } from "@/lib/products";
import { useLocale } from "@/components/i18n";
import { useSearchWorks } from "@/hooks/use-search-works";
import {
  openHeaderOverlay,
  useEscape,
  useHeaderOverlay,
} from "@/hooks/use-header-overlay";
import { UtilityButton } from "@/components/ui/utility-button";

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const { locale, t, href } = useLocale();
  const { normalizedQuery, results } = useSearchWorks(query);
  const close = useCallback(() => setOpen(false), []);

  useHeaderOverlay("search", close);
  useEscape(close);
  useEffect(() => close(), [pathname, close]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative">
      <UtilityButton
        label={open ? t("closeSearch") : t("searchAria")}
        aria-expanded={open}
        aria-controls="site-search-panel"
        onClick={() =>
          setOpen((current) => {
            const next = !current;
            if (next) openHeaderOverlay("search");
            return next;
          })
        }
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </UtilityButton>
      {open && (
        <section
          id="site-search-panel"
          className="absolute end-0 top-[calc(100%+1rem)] z-50 w-[min(520px,calc(100vw-2*theme(spacing.page)))] rounded-xl border border-rad-line bg-rad-paper p-4 shadow-[0_18px_45px_rgba(31,25,21,0.14)]"
        >
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-rad-ink focus-within:border-rad-clay">
            <Search className="h-5 w-5" aria-hidden="true" />
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
              className="min-h-12 w-full border-0 bg-transparent font-sans outline-none"
            />
            {query && (
              <button
                type="button"
                className="h-10 w-10 border-0 bg-transparent"
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>
          {normalizedQuery && (
            <div className="pt-4" aria-live="polite">
              <b className="text-caption text-rad-clay">{t("searchResults")}</b>
              {results.length ? (
                <ul className="m-0 max-h-[min(55vh,420px)] list-none overflow-auto p-0 pt-2">
                  {results.map((product) => {
                    const copy = productCopy(product, locale);
                    return (
                      <li
                        key={product.slug}
                        className="border-t border-rad-line first:border-0"
                      >
                        <Link
                          href={href(`/products/${product.slug}`)}
                          onClick={() => setOpen(false)}
                          className="flex items-baseline justify-between gap-4 py-3"
                        >
                          <span>{copy.name}</span>
                          <small className="text-rad-muted">
                            {copy.subtitle}
                          </small>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-rad-muted">{t("searchEmpty")}</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
