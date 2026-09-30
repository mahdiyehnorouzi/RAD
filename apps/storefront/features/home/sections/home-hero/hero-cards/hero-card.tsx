"use client";

import type { CSSProperties } from "react";
import { heroCardCopy } from "@/features/home/const";
import type { HeroCard as HeroCardData } from "@/features/home/type";
import { useLocale } from "@/components/i18n";
import { ObjectStamp } from "@/components/identity";
import { formatRadDigits } from "@/components/product";
import styles from "./hero-card.module.css";

export function HeroCard({
  card,
  position,
  offset,
  wrapping,
  turned,
  onSelect,
  onTurn,
}: {
  card: HeroCardData;
  /** 1-based place in the fan, pencilled on the photograph like a product card's number. */
  position: number;
  /** Signed distance from the centre: 0 is the card on show, 1 the next one toward the reading end. */
  offset: number;
  wrapping: boolean;
  turned: boolean;
  onSelect: () => void;
  onTurn: () => void;
}) {
  const { locale, number } = useLocale();
  const copy = heroCardCopy[locale];
  const isActive = offset === 0;
  const showsBack = isActive && turned;
  const digits = formatRadDigits(position, number, locale);

  return (
    <div
      className={styles.heroCard}
      data-tone={card.tone}
      data-active={isActive}
      data-turned={showsBack}
      data-wrapping={wrapping}
      style={
        {
          "--o": offset,
          "--abs": Math.abs(offset),
          zIndex: 3 - Math.abs(offset),
        } as CSSProperties
      }
    >
      <div className={styles.heroCardDeal}>
        <div className={styles.heroCardSheet}>
          <div
            className={`${styles.heroCardFace} ${styles.heroCardFront}`}
            inert={showsBack}
          >
            <span className={styles.heroCardFrame} aria-hidden="true" />
            <span className={styles.heroCardWindow}>
              <img src={card.src} alt={card.alt} draggable={false} />
            </span>
            <span className={styles.heroCardMark} aria-hidden="true">
              <b>{digits}</b>
              <svg viewBox="0 0 64 8" focusable="false">
                <path d="M2 5.6c8.6-2.8 18.4-3.5 28.6-2.5 9.6.9 19.2 1.1 31.4-1.9" />
              </svg>
              <small>RĀD</small>
            </span>
            <span className={styles.heroCardPin} aria-hidden="true" />
            <button
              type="button"
              className={styles.heroCardHit}
              aria-label={
                isActive
                  ? copy.turnOver(card.title)
                  : copy.bringForward(card.title)
              }
              onClick={isActive ? onTurn : onSelect}
            />
          </div>

          <div
            className={`${styles.heroCardFace} ${styles.heroCardBack}`}
            inert={!showsBack}
            aria-hidden={!showsBack}
          >
            <button
              type="button"
              className={styles.heroCardHit}
              aria-label={copy.turnBack}
              onClick={onTurn}
            />
            <span className={styles.heroCardPin} aria-hidden="true" />
            <p className={styles.heroCardLabel}>{card.title}</p>
            {card.noteArt ? (
              <img
                className={`${styles.heroCardNote} ${styles.ink}`}
                src={card.noteArt}
                alt={card.note}
                draggable={false}
              />
            ) : (
              <p className={styles.heroCardNote}>{card.note}</p>
            )}
            <ObjectStamp
              className={styles.heroCardStamp}
              radNumber={position}
              code={digits}
              year={`${number(1)}/${number(1)}`}
              label={copy.stamp(digits)}
              emblem="sprig"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
