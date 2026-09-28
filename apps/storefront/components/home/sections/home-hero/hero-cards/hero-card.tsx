"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { heroCardCopy } from "@/components/home/const";
import type { HeroCard as HeroCardData } from "@/components/home/type";
import { useLocale } from "@/components/i18n";
import { publicPageUrl, qrModulePath } from "@/lib/qr";

export function HeroCard({
  card,
  offset,
  wrapping,
  turned,
  onSelect,
  onTurn,
}: {
  card: HeroCardData;
  /** Signed distance from the centre: 0 is the card on show, 1 the next one toward the reading end. */
  offset: number;
  wrapping: boolean;
  turned: boolean;
  onSelect: () => void;
  onTurn: () => void;
}) {
  const { locale, href, t } = useLocale();
  const copy = heroCardCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const isActive = offset === 0;
  const showsBack = isActive && turned;
  const cardHref = href(card.href);
  const qr = useMemo(() => qrModulePath(publicPageUrl(cardHref)), [cardHref]);

  return (
    <div
      className="hero-card"
      data-tone={card.tone}
      data-active={isActive}
      data-turned={showsBack}
      data-wrapping={wrapping}
      style={
        {
          "--o": offset,
          "--abs": Math.abs(offset),
          zIndex: isActive ? 3 : 1,
        } as CSSProperties
      }
    >
      <div className="hero-card-deal">
        <div className="hero-card-sheet">
          <div className="hero-card-face hero-card-front" inert={showsBack}>
            <span className="hero-card-window">
              <img src={card.src} alt={card.alt} draggable={false} />
            </span>
            <span className="hero-card-tag" aria-hidden="true">
              <span>{card.conceptLabel}</span>
              <span>{t("tehranSlashYear")}</span>
            </span>
            <span className="hero-card-pin" aria-hidden="true" />
            <button
              type="button"
              className="hero-card-hit"
              aria-label={isActive ? copy.turnOver(card.title) : copy.bringForward(card.title)}
              onClick={isActive ? onTurn : onSelect}
            />
          </div>

          <div
            className="hero-card-face hero-card-back"
            inert={!showsBack}
            aria-hidden={!showsBack}
          >
            <button
              type="button"
              className="hero-card-hit"
              aria-label={copy.turnBack}
              onClick={onTurn}
            />
            <span className="hero-card-pin" aria-hidden="true" />
            <p className="hero-card-title">{card.title}</p>
            <p className="hero-card-material">{card.material}</p>
            <p className="hero-card-note">{card.note}</p>
            <svg
              className="hero-card-qr"
              viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`}
              shapeRendering="crispEdges"
              aria-hidden="true"
            >
              <path d={qr.d} />
            </svg>
            <Link className="hero-card-link" href={cardHref}>
              <span>{copy.begin}</span>
              <Arrow aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
