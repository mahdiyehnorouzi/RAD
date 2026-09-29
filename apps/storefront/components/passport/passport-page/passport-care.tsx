"use client";

import { useLocale } from "@/components/i18n";
import { formatPassportCode } from "@/lib/passport";
import type { RadPassport } from "../type";

/** Care instructions as the paper tag that hangs from the work. */
export function PassportCare({ passport }: { passport: RadPassport }) {
  const { locale, t, number } = useLocale();

  return (
    <section className="passport-care" aria-labelledby="passport-care-title">
      <svg className="passport-care-string" viewBox="0 0 60 90" aria-hidden="true" focusable="false">
        <path d="M30 0c-6 18 10 30 2 48s-4 30 0 42" pathLength={1} />
      </svg>
      <div className="passport-care-tag">
        <span className="passport-care-hole" aria-hidden="true" />
        <h2 id="passport-care-title">{t("passportCare")}</h2>
        <p>{passport.care[locale]}</p>
        <small dir="ltr">RĀD / {formatPassportCode(passport.code, locale, number)}</small>
      </div>
    </section>
  );
}
