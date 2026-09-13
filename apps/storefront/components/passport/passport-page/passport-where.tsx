"use client";

import { useLocale } from "@/components/i18n";
import type { RadPassport } from "../type";

export function PassportWhere({ passport }: { passport: RadPassport }) {
  const { locale, t } = useLocale();
  return (
    <section className="passport-where" aria-labelledby="passport-where-title">
      <span className="eyebrow">{t("passportWhereEyebrow")}</span>
      <h2 id="passport-where-title">{t("passportWhere")}</h2>
      <p className="passport-where-now">{passport.whereabouts.current[locale]}</p>
      <ol>
        {passport.whereabouts.trail.map((stop, index) => (
          <li key={`${stop.place.en}-${index}`}>
            <b>{stop.place[locale]}</b>
            <span>{stop.note[locale]}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
