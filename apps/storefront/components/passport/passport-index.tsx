"use client";

import Link from "next/link";
import type { ProductStatus } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { useLivePieces, usePassports } from "@/hooks/use-artworks";
import { productStatusLabelKey } from "@/lib/catalog/product-status";
import { formatPassportCode, formatPassportName } from "@/lib/passport";
import "./passport-page/passport-page.css";

export function PassportIndex() {
  const { locale, t, number, href } = useLocale();
  const livePieces = useLivePieces();
  const passports = usePassports();
  const label = (status?: ProductStatus) => {
    if (!status) return "";
    return status === "sold" || status === "archived"
      ? t("archiveSoldMark")
      : t(productStatusLabelKey[status]);
  };
  const making = livePieces.map((piece) => ({
    code: piece.code,
    href: `/now/${piece.code}`,
    title:
      locale === "fa"
        ? `رَد ${formatPassportCode(piece.code, locale, number)} — ${piece.name.fa}`
        : `RAD ${formatPassportCode(piece.code, locale, number)} — ${piece.name.en}`,
    status: label(piece.status),
  }));
  const finished = passports.map((passport) => ({
    code: passport.code,
    href: `/passport/${passport.code}`,
    title: formatPassportName(passport, locale, number),
    status: label(passport.status),
  }));
  const rows = [...making, ...finished].sort(
    (a, b) => Number(a.code) - Number(b.code),
  );

  return (
    <section className="passport-index">
      <header>
        <span className="eyebrow">{t("archiveEyebrowFull")}</span>
        <h1>{t("archiveTitleFull")}</h1>
        <p>{t("archiveBodyFull")}</p>
      </header>
      <ol>
        {rows.map((row) => (
          <li key={row.code}>
            <Link href={href(row.href)}>
              <small>{formatPassportCode(row.code, locale, number)}</small>
              <b>{row.title}</b>
              <span>{row.status}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
