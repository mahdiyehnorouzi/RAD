import type { Locale } from "@rad/types";

/**
 * Public URLs stay `/path` (fa) and `/path?lang=en`; `proxy.ts` rewrites them
 * to the internal `app/[locale]` segment so the server renders the right language.
 */
export const LOCALES = ["fa", "en"] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = "fa";
export const LOCALE_COOKIE = "rad-locale";
export const LOCALE_QUERY = "lang";

export function isLocale(value: unknown): value is Locale {
  return value === "fa" || value === "en";
}

export function localeDirection(locale: Locale) {
  return locale === "fa" ? "rtl" : "ltr";
}

/** `/fa/products/x` → `/products/x`; public paths pass through unchanged. */
export function publicPathname(pathname: string) {
  const [, first, ...rest] = pathname.split("/");
  return isLocale(first) ? `/${rest.join("/")}` : pathname;
}
