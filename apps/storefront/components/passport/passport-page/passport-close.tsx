"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { RadFingerprint } from "@/components/identity";
import { formatPassportName, relatedByFeeling } from "@/lib/passport";
import type { RadPassport } from "../type";

/** The sign-off: related works when this one is gone, then the ways onward. */
export function PassportClose({
  passport,
  passports,
  sold,
}: {
  passport: RadPassport;
  passports: RadPassport[];
  sold: boolean;
}) {
  const { locale, t, number, href } = useLocale();
  const [copied, setCopied] = useState(false);
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const related = sold ? relatedByFeeling(passports, passport.code) : [];
  const onSale = passport.productSlug && passport.status && !sold;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${href(`/passport/${passport.code}`)}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <footer className="passport-close">
      {related.length ? (
        <section className="passport-related" aria-labelledby="passport-related-title">
          <h2 id="passport-related-title">{t("sameFeeling")}</h2>
          <ul>
            {related.map((item) => (
              <li key={item.code}>
                <Link href={href(`/passport/${item.code}`)}>
                  <span>{formatPassportName(item, locale, number)}</span>
                  <Arrow aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <Link className="passport-link" href={href("/shape")}>
            {t("shapeTitle")}
          </Link>
        </section>
      ) : null}

      <div className="passport-sign">
        <RadFingerprint radNumber={passport.radNumber} className="passport-sign-print" />
        <p>{t("passportOnce")}</p>
      </div>

      <nav className="passport-actions" aria-label={t("passportEyebrow")}>
        {onSale ? (
          <Link className="passport-action is-solid" href={href(`/products/${passport.productSlug}`)}>
            <span>{t("passportViewWork")}</span>
            <Arrow aria-hidden="true" />
          </Link>
        ) : null}
        {passport.differenceId ? (
          <Link
            className={`passport-action${onSale ? "" : " is-solid"}`}
            href={href(`/differences/${passport.differenceId}`)}
          >
            <span>{t("museumTitle")}</span>
            <Arrow aria-hidden="true" />
          </Link>
        ) : null}
        <button type="button" className="passport-action" onClick={copyLink}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span aria-live="polite">{copied ? t("passportCopied") : t("passportCopyLink")}</span>
        </button>
        <Link className="passport-link" href={href("/products")}>
          {t("allWorks")}
        </Link>
      </nav>
    </footer>
  );
}
