"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { mockStorefront } from "@/lib/mock-data";
import { fa, type MessageKey } from "@/i18n/fa";
import { en } from "@/i18n/en";

export type Locale = "fa" | "en";
export type { MessageKey };

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
const storageKey = "rad-locale";

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? `{${key}}`),
  );
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fa");
  const pathname = usePathname();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("lang");
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {}
    const initial: Locale =
      query === "en" || query === "fa" ? query : saved === "en" ? "en" : "fa";
    setLocaleState(initial);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    document.documentElement.dataset.locale = locale;
    try {
      localStorage.setItem(storageKey, locale);
    } catch {}
    const catalog = messages[locale];
    const labels: Array<[string, MessageKey]> = [
      ["account", "titleAccount"],
      ["favorites", "titleFavorites"],
      ["cart", "titleCart"],
      ["checkout", "titleCheckout"],
      ["products", "titleProducts"],
      ["studio", "titleStudio"],
      ["making", "titleMaking"],
      ["workshop", "titleWorkshop"],
      ["differences", "titleDifferences"],
    ];
    const section = labels.find(([key]) => pathname.includes(key))?.[1];
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
        setLocaleState(next);
        const url = new URL(window.location.href);
        if (next === "en") url.searchParams.set("lang", "en");
        else url.searchParams.delete("lang");
        window.history.replaceState({}, "", url);
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
