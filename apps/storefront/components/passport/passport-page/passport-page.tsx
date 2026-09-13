"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { formatPassportCode, formatPassportName, relatedByFeeling } from "@/lib/passport";
import { BeforeRad } from "../before-rad";
import type { RadPassport } from "../type";
import { WorkMarks } from "../work-marks";
import { PassportFamily } from "./passport-family";
import { PassportLedger } from "./passport-ledger";
import { PassportLife } from "./passport-life";
import { PassportMark } from "./passport-mark";
import { PassportWhere } from "./passport-where";
import "./passport-page.css";

export function PassportPage({ passport }: { passport: RadPassport }) {
  const { locale, t, number, href } = useLocale();
  const code = formatPassportCode(passport.code, locale, number);
  const path = `/passport/${passport.code}`;

  return (
    <article className="passport-page">
      <header className="passport-hero">
        <span className="eyebrow">{t("passportEyebrow")}</span>
        <p className="passport-edition">
          {code} / {t("oneOfOne")}
        </p>
        <h1>{formatPassportName(passport, locale, number)}</h1>
        <p className="passport-once">
          {t("passportOnce")}
          <span>{t("passportOnceBody")}</span>
        </p>
        {passport.sold ? <p className="passport-sold">{t("archiveNeverAgain")}</p> : null}
        {passport.transfers?.at(-1) ? (
          <p className="passport-transfer">
            {t("transferLine", {
              from: passport.transfers.at(-1)!.from[locale],
              to: passport.transfers.at(-1)!.to[locale],
              when: passport.transfers.at(-1)!.when[locale],
            })}
          </p>
        ) : null}
      </header>

      <div className="passport-layout">
        <PassportLedger passport={passport} />
        <PassportMark passport={passport} path={path} />
      </div>

      <PassportWhere passport={passport} />
      <PassportLife passport={passport} />
      {passport.marks?.length && passport.finalPhotos[0] ? (
        <WorkMarks src={passport.finalPhotos[0].src} marks={passport.marks} />
      ) : null}
      <PassportFamily passport={passport} />
      <BeforeRad frames={passport.beforeRad} />

      <section className="passport-care">
        <h2>{t("passportCare")}</h2>
        <p>{passport.care[locale]}</p>
      </section>

      {passport.sold ? (
        <section className="passport-same-feeling">
          <h2>{t("sameFeeling")}</h2>
          <ul>
            {relatedByFeeling(passport.code).map((item) => (
              <li key={item.code}>
                <Link href={href(`/passport/${item.code}`)}>
                  {formatPassportName(item, locale, number)}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/shape" outline>
            {t("shapeTitle")}
          </ButtonLink>
        </section>
      ) : null}

      <div className="passport-actions">
        {passport.productSlug && !passport.sold ? (
          <ButtonLink href={`/products/${passport.productSlug}`}>
            {t("passportViewWork")}
          </ButtonLink>
        ) : null}
        {passport.differenceId ? (
          <ButtonLink href={`/differences/${passport.differenceId}`} outline>
            {t("museumTitle")}
          </ButtonLink>
        ) : null}
        <Link href={href("/passport")} className="button outline">
          {t("passportBack")}
        </Link>
      </div>
    </article>
  );
}
