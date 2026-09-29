"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { formatPassportCode } from "@/lib/passport";
import { nowCopy, nowMedia } from "./const";
import type { LivePiece } from "./type";
import "./now.css";
import "./now-index.css";

export function NowIndex({ livePieces }: { livePieces: LivePiece[] }) {
  const { locale, t, number, href } = useLocale();
  const c = nowCopy[locale];

  return (
    <section className="now-index" aria-labelledby="now-title">
      <header className="now-index-head">
        <h1 id="now-title">{t("titleNow")}</h1>
        <svg
          className="live-stroke"
          viewBox="0 0 80 14"
          aria-hidden="true"
          focusable="false"
        >
          <path pathLength={1} d="M3 10C18 5 38 3 56 4C66 5 72 6 77 8" />
        </svg>
        <p>{c.indexLede}</p>
      </header>

      {livePieces.length ? (
        <ol className="now-index-list">
          {livePieces.map((piece) => {
            const step = Math.max(
              0,
              piece.milestones.findIndex((item) => item.current),
            );
            const current = piece.milestones[step];
            const code = formatPassportCode(piece.code, locale, number);
            const stageOf = c.stageOf
              .replace("{step}", number(step + 1))
              .replace("{total}", number(piece.milestones.length));
            return (
              <li key={piece.code}>
                <Link className="now-card" href={href(`/now/${piece.code}`)}>
                  {current?.media ? (
                    <span className="now-card-media">
                      <Image
                        src={current.media}
                        {...nowMedia.stage}
                        alt=""
                        sizes="(min-width: 960px) 24rem, (min-width: 600px) 46vw, 90vw"
                      />
                    </span>
                  ) : null}
                  <span className="now-card-code">
                    {locale === "fa" ? "رَد" : "RAD"} {code}
                  </span>
                  <h2>
                    {piece.name[locale]}
                    <span> · {piece.maker[locale]}</span>
                  </h2>
                  <span className="now-card-stage">
                    {t("liveNow")}: <b>{current?.title[locale]}</b>
                  </span>
                  <span
                    className="now-card-rail"
                    role="img"
                    aria-label={stageOf}
                  >
                    {piece.milestones.map((milestone) => (
                      <i
                        key={milestone.id}
                        data-state={
                          milestone.current
                            ? "current"
                            : milestone.done
                              ? "done"
                              : "next"
                        }
                      />
                    ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="now-index-empty">
          <p>{c.indexEmpty}</p>
          <Link className="live-pill" href={href("/products")}>
            {c.indexEmptyCta}
          </Link>
        </div>
      )}
    </section>
  );
}
