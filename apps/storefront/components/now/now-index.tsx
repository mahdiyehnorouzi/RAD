"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { useLivePieces } from "@/hooks/use-artworks";
import { formatPassportCode } from "@/lib/passport";
import "./now-index.css";

export function NowIndex() {
  const { locale, t, number, href } = useLocale();
  const livePieces = useLivePieces();

  return (
    <section className="now-index">
      <header>
        <span className="eyebrow">{t("todayWorkshop")}</span>
        <h1>{t("titleNow")}</h1>
        <p>{t("archiveBodyFull")}</p>
      </header>
      <ol>
        {livePieces.map((piece) => {
          const current = piece.milestones.find((item) => item.current);
          return (
            <li key={piece.code}>
              <Link href={href(`/now/${piece.code}`)}>
                <small>{formatPassportCode(piece.code, locale, number)}</small>
                <b>
                  {locale === "fa" ? "رَد" : "RAD"}{" "}
                  {formatPassportCode(piece.code, locale, number)}
                  {" — "}
                  {piece.name[locale]}
                </b>
                <span>
                  {t("liveNow")}: {current?.title[locale]}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
