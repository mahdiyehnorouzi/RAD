"use client";

import { MapPin } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { RadPassport } from "../type";

/** Where the work lives now, with every stop on its trail pressed in as an entry stamp. */
export function PassportWhere({ passport }: { passport: RadPassport }) {
  const { locale, t, number } = useLocale();
  const trail = passport.whereabouts.trail;
  const transfer = passport.transfers?.at(-1);

  return (
    <section className="passport-where passport-band" aria-labelledby="passport-where-title">
      <svg className="passport-ink-defs" aria-hidden="true" focusable="false">
        <filter id="passport-ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={passport.radNumber} result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.9"
            result="coverage"
          />
          <feComposite in="SourceGraphic" in2="coverage" operator="in" />
        </filter>
      </svg>

      <div className="passport-where-page">
        <header className="passport-head">
          <h2 id="passport-where-title">{t("passportWhere")}</h2>
          <p className="passport-where-now">
            <MapPin aria-hidden="true" />
            <span>{passport.whereabouts.current[locale]}</span>
          </p>
          {transfer ? (
            <p>
              {t("transferLine", {
                from: transfer.from[locale],
                to: transfer.to[locale],
                when: transfer.when[locale],
              })}
            </p>
          ) : null}
        </header>

        <ol className="passport-stamps">
          {trail.map((stop, index) => {
            const last = index === trail.length - 1;
            const note = stop.note[locale];
            return (
              <li
                key={`${stop.place.en}-${index}`}
                className={`passport-stamp${last ? " is-current" : ""}`}
                aria-current={last ? "location" : undefined}
              >
                <span className="passport-stamp-no">
                  {number(index + 1).padStart(2, locale === "fa" ? "۰" : "0")}
                </span>
                <b>{stop.place[locale]}</b>
                {last ? <em>{note}</em> : <span>{note}</span>}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
