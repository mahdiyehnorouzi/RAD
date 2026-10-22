import type { Locale } from "@rad/types";
import { fa, type MessageKey } from "@/i18n/fa";
import { en } from "@/i18n/en";

export type { MessageKey };

export const messages = { fa, en } as const;

export type Vars = Record<string, string | number>;

export function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? `{${key}}`),
  );
}

/** Same rule the client LocaleProvider uses: `fa` is the default and stays
 * at the bare path, `en` carries an explicit `?lang=en` so links keep the
 * reader's chosen language across navigations. */
export function buildHref(locale: Locale, path: string) {
  if (locale !== "en") return path;
  const [base, hash] = path.split("#");
  const localized = `${base}${base.includes("?") ? "&" : "?"}lang=en`;
  return hash ? `${localized}#${hash}` : localized;
}

export function formatNumber(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(
    value,
  );
}
