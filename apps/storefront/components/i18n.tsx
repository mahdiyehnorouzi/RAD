"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@rad/types";
import { mockStorefront } from "@/lib/catalog/mock-storefront";
import { fa, type MessageKey } from "@/i18n/fa";
import { en } from "@/i18n/en";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_QUERY,
  isLocale,
} from "@/lib/locale";

export type { Locale, MessageKey };

const messages = { fa, en } as const;

type Vars = Record<string, string | number>;
type LocaleContextValue = {
  locale: Locale;
  t: (key: MessageKey, vars?: Vars) => string;
  setLocale: (locale: Locale) => void;
  href: (path: string) => string;
  number: (value: number) => string;
};
const LocaleContext = createContext<LocaleContextValue | null>(null);
const oneYear = 60 * 60 * 24 * 365;

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? `{${key}}`),
  );
}

function saveLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${oneYear}; samesite=lax`;
}

function savedLocale() {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  return match?.[1];
}

/** Switching language changes the root layout, so it is a full navigation. */
function switchLocale(next: Locale) {
  saveLocale(next);
  const url = new URL(window.location.href);
  if (next === DEFAULT_LOCALE) url.searchParams.delete(LOCALE_QUERY);
  else url.searchParams.set(LOCALE_QUERY, next);
  window.location.assign(url);
}

/** `locale` comes from the `app/[locale]` segment that `proxy.ts` rewrites to. */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useEffect(() => {
    // Preferences saved in localStorage before the cookie existed.
    let legacy: string | null = null;
    try {
      legacy = localStorage.getItem(LOCALE_COOKIE);
      localStorage.removeItem(LOCALE_COOKIE);
    } catch {}
    const explicit = new URLSearchParams(window.location.search).get(
      LOCALE_QUERY,
    );
    if (
      !savedLocale() &&
      !isLocale(explicit) &&
      isLocale(legacy) &&
      legacy !== locale
    ) {
      switchLocale(legacy);
      return;
    }
    saveLocale(locale);
  }, [locale]);
  useEffect(() => {
    // Keep generateMetadata / layout titles for public detail URLs (SEO).
    const keepsServerTitle =
      /^\/products\/[^/]+/.test(pathname) ||
      /^\/differences\/[^/]+/.test(pathname) ||
      /^\/passport\/[^/]+/.test(pathname) ||
      /^\/now\/[^/]+/.test(pathname);
    if (keepsServerTitle) return;

    const catalog = messages[locale];
    const labels: Array<[string, MessageKey]> = [
      ["account/notifications", "titleNotifications"],
      ["account/info", "titleAccountInfo"],
      ["account/making", "titleCustomOrders"],
      ["account", "titleAccount"],
      ["favorites", "titleFavorites"],
      ["cart", "titleCart"],
      ["checkout", "titleCheckout"],
      ["products", "titleProducts"],
      ["studio", "titleStudio"],
      ["workshop", "titleWorkshop"],
      ["orders", "titleOrders"],
      ["differences", "titleDifferences"],
      ["passport", "titlePassport"],
      ["archive", "titleArchive"],
      ["shape", "titleShape"],
      ["now", "titleNow"],
      ["about", "navAbout"],
      ["contact", "titleContact"],
      ["help", "titleHelp"],
    ];
    const section: MessageKey | undefined =
      pathname === "/making"
        ? "makingProcessTitle"
        : /^\/making\/.+/.test(pathname)
          ? "titleMaking"
          : pathname.includes("account/making")
            ? "titleCustomOrders"
            : labels.find(([key]) => pathname.includes(key))?.[1];
    document.title = section
      ? `${catalog[section]} | ${catalog.brandName}`
      : locale === "fa"
        ? mockStorefront.brand.title.fa
        : mockStorefront.brand.title.en;
  }, [locale, pathname]);
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: (key, vars) => interpolate(messages[locale][key], vars),
      setLocale: (next) => {
        if (next !== locale) switchLocale(next);
      },
      href: (path) => {
        if (locale !== "en") return path;
        const [base, hash] = path.split("#");
        const localized = `${base}${base.includes("?") ? "&" : "?"}lang=en`;
        return hash ? `${localized}#${hash}` : localized;
      },
      number: (value) =>
        new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(
          value,
        ),
    }),
    [locale],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
