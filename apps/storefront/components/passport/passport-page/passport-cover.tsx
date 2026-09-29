"use client";

import type { CSSProperties } from "react";
import { useLocale } from "@/components/i18n";
import { ObjectStamp, RadFingerprint } from "@/components/identity";
import { formatPassportCode, passportYear } from "@/lib/passport";
import { passportTears } from "../const";
import type { RadPassport } from "../type";
import { PassportLedger } from "./passport-ledger";
import { PassportTear } from "./passport-tear";

/** The work's photograph with the passport sheet torn over it. */
export function PassportCover({
  passport,
  sold,
}: {
  passport: RadPassport;
  sold: boolean;
}) {
  const { locale, t, number } = useLocale();
  const code = formatPassportCode(passport.code, locale, number);
  const year = passportYear(passport, locale);
  const photo = passport.finalPhotos[0] ?? passport.construction[0];
  const swatch = passport.beforeRad.at(-1);

  return (
    <header className="passport-cover">
      <figure
        className="passport-cover-media"
        style={
          swatch
            ? ({ "--cover-color": swatch.color, "--cover-accent": swatch.accent } as CSSProperties)
            : undefined
        }
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.src} alt={photo.note[locale]} fetchPriority="high" />
        ) : null}
      </figure>

      <div className="passport-sheet">
        <PassportTear shape={passportTears.cover} className="passport-sheet-top" />
        <PassportTear shape={passportTears.side} className="passport-sheet-side" />

        <div className="passport-sheet-head">
          <div className="passport-sheet-title">
            <span className="passport-kicker">{t("passportEyebrow")}</span>
            <h1 id="passport-title">{passport.name[locale]}</h1>
          </div>

          <div className="passport-seal">
            <RadFingerprint
              radNumber={passport.radNumber}
              density="field"
              className="passport-seal-print"
              animate
            />
            <ObjectStamp
              className="passport-seal-stamp"
              radNumber={passport.radNumber}
              code={code}
              year={year}
              label={[`RĀD ${code}`, t("oneOfOne"), year]
                .filter(Boolean)
                .join(locale === "fa" ? "، " : ", ")}
            />
          </div>

          <div className="passport-sheet-lede">
            <p>{t("passportCoverLede")}</p>
            {sold ? <p className="passport-sold">{t("archiveNeverAgain")}</p> : null}
          </div>
        </div>

        <PassportLedger passport={passport} />
      </div>
    </header>
  );
}
