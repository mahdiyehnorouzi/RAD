"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { findPassport, formatPassportCode, formatPassportName } from "@/lib/passport";
import { MY_RAD_CODES } from "../const/my-rads";
import "./collection.css";

export function Collection() {
  const { locale, t, number, href } = useLocale();
  const pieces = MY_RAD_CODES.map(findPassport).filter(
    (item): item is NonNullable<typeof item> => Boolean(item),
  );

  return (
    <section className="my-rads">
      <header>
        <span className="eyebrow">{t("myRadsEyebrow")}</span>
        <h2>{t("myRadsTitle")}</h2>
        <p>{t("myRadsBody")}</p>
      </header>
      <ol>
        {pieces.map((passport) => {
          const transfer = passport.transfers?.at(-1);
          return (
            <li key={passport.code}>
              <Link href={href(`/passport/${passport.code}`)}>
                <small>{formatPassportCode(passport.code, locale, number)}</small>
                <b>{formatPassportName(passport, locale, number)}</b>
                {transfer ? (
                  <span>
                    {t("transferLine", {
                      from: transfer.from[locale],
                      to: transfer.to[locale],
                      when: transfer.when[locale],
                    })}
                  </span>
                ) : (
                  <span>{passport.city[locale]}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
