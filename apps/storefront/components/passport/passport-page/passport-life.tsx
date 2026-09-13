"use client";

import { useLocale } from "@/components/i18n";
import type { RadPassport } from "../type";

export function PassportLife({ passport }: { passport: RadPassport }) {
  const { locale, t } = useLocale();
  return (
    <section className="passport-life">
      {passport.firstSketch ? (
        <figure>
          <figcaption>{t("passportSketch")}</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={passport.firstSketch.src} alt={passport.firstSketch.note[locale]} />
          <p>{passport.firstSketch.note[locale]}</p>
        </figure>
      ) : null}

      {passport.construction.length ? (
        <div className="passport-life-grid">
          <h2>{t("passportConstruction")}</h2>
          <ul>
            {passport.construction.map((photo) => (
              <li key={photo.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.note[locale]} />
                <p>{photo.note[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <blockquote>
        <span>{t("passportChanges")}</span>
        <p>{passport.unexpectedChanges[locale]}</p>
      </blockquote>

      {passport.finalPhotos.length ? (
        <div className="passport-life-grid">
          <h2>{t("passportFinal")}</h2>
          <ul>
            {passport.finalPhotos.map((photo) => (
              <li key={photo.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.note[locale]} />
                <p>{photo.note[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
