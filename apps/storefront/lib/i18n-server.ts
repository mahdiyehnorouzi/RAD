import { locale as rootLocale } from "next/root-params";
import {
  buildHref,
  formatNumber,
  interpolate,
  messages,
  type MessageKey,
  type Vars,
} from "@/lib/i18n-messages";
import { DEFAULT_LOCALE, isLocale } from "@/lib/locale";

/**
 * Server-only counterpart to `useLocale()` (components/i18n.tsx), for Server
 * Components that only need to read translated strings/links - not
 * `setLocale` or any other browser-only behavior, which stay client-side.
 * Reads the same root `[locale]` segment `components/i18n.tsx` is handed as
 * a prop from the root layout, via `next/root-params` instead of prop
 * drilling, and reuses the exact same dictionaries/helpers the client hook
 * does (lib/i18n-messages.ts) so the two can never drift apart.
 */
export async function getTranslations() {
  const segment = await rootLocale();
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE;
  return {
    locale,
    t: (key: MessageKey, vars?: Vars) =>
      interpolate(messages[locale][key], vars),
    href: (path: string) => buildHref(locale, path),
    number: (value: number) => formatNumber(locale, value),
  };
}
