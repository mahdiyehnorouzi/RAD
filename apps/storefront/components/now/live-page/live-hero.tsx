"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { formatPassportCode } from "@/lib/passport";
import { nowCopy, nowMedia } from "../const";
import type { LivePiece } from "../type";

export function LiveHero({ piece }: { piece: LivePiece }) {
  const { locale, t, number } = useLocale();
  const c = nowCopy[locale];
  const code = formatPassportCode(piece.code, locale, number);
  const headline = t("liveHeadline", { code });
  const split = headline.indexOf(code) + code.length;

  return (
    <header className="live-hero">
      <div className="live-hero-copy">
        <span className="live-eyebrow">{t("liveEyebrow")}</span>
        <h1>
          <span>{headline.slice(0, split)}</span> <span>{headline.slice(split).trim()}</span>
        </h1>
        <svg className="live-stroke" viewBox="0 0 80 14" aria-hidden="true" focusable="false">
          <path pathLength={1} d="M3 10C18 5 38 3 56 4C66 5 72 6 77 8" />
        </svg>
        <p className="live-byline">
          {piece.name[locale]} · {piece.maker[locale]}
        </p>
        <p className="live-lede">{c.lede}</p>
      </div>

      <div className="live-hero-media">
        <div className="live-hero-frame">
          <Image
            {...nowMedia.hero}
            alt={c.heroAlt}
            sizes="(min-width: 960px) 50vw, 55vw"
            preload
          />
        </div>
        <svg
          className="live-thread live-hero-thread"
          viewBox="0 0 260 340"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            pathLength={1}
            d="M214 -6C170 4 104 2 62 30C22 58 8 104 12 160C16 214 30 262 70 296C112 330 190 336 268 318"
          />
        </svg>
      </div>
    </header>
  );
}
