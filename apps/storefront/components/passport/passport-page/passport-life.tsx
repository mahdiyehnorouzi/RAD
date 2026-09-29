"use client";

import { useLocale } from "@/components/i18n";
import type { MessageKey } from "@/i18n/fa";
import type { PassportPhoto, RadPassport } from "../type";

type Print = { photo: PassportPhoto; tag: MessageKey };

/** The making log: the recorded photographs as pinned prints, then the change the fire made. */
export function PassportLife({ passport }: { passport: RadPassport }) {
  const { locale, t } = useLocale();
  const prints: Print[] = [
    ...(passport.firstSketch ? [{ photo: passport.firstSketch, tag: "passportSketch" as const }] : []),
    ...passport.construction.map((photo) => ({ photo, tag: "passportTagMaking" as const })),
    ...passport.finalPhotos.map((photo) => ({ photo, tag: "passportTagFinal" as const })),
  ];

  return (
    <section className="passport-life passport-band" aria-labelledby="passport-life-title">
      <header className="passport-head">
        <h2 id="passport-life-title">{t("passportLogTitle")}</h2>
        <p>{t("passportLogBody")}</p>
      </header>

      {prints.length ? (
        <ol className="passport-prints" tabIndex={0} aria-label={t("passportLogTitle")}>
          {prints.map(({ photo, tag }, index) => (
            <li key={`${photo.src}-${index}`} className="passport-print">
              <figure>
                <span className="passport-print-pin" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.note[locale]} loading="lazy" />
                <figcaption>
                  <span>{t(tag)}</span>
                  <p>{photo.note[locale]}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
      ) : null}

      <blockquote className="passport-change">
        <span>{t("passportChanges")}</span>
        <p>{passport.unexpectedChanges[locale]}</p>
        <svg viewBox="0 0 160 14" aria-hidden="true" focusable="false">
          <path d="M3 9c18-5 34-6 52-3s30 5 47 1 34-6 55-2" pathLength={1} />
        </svg>
      </blockquote>
    </section>
  );
}
