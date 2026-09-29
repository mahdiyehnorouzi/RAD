"use client";

import { useState, type FocusEvent } from "react";
import { heroCardCopy, heroCards } from "@/components/home/const";
import { useInView } from "@/components/home/hooks";
import { useLocale } from "@/components/i18n";
import { HeroCard } from "./hero-card";
import { useCardSwipe, useHeroCycle } from "./hooks";
import "./hero-cards.css";

function signedOffset(index: number, active: number, count: number) {
  const offset = (((index - active) % count) + count) % count;
  return offset > count / 2 ? offset - count : offset;
}

/**
 * A fan of works on the plinth. The centre photograph turns over to show
 * its record, then the next work steps forward, following the reading direction.
 */
export function HeroCards() {
  const { locale } = useLocale();
  const copy = heroCardCopy[locale];
  const cards = heroCards(locale);
  const isRtl = locale === "fa";
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25, once: false });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { active, from, turned, goTo, next, prev, turn } = useHeroCycle(
    cards.length,
    hovered || focused || !inView,
  );
  const swipe = useCardSwipe(isRtl ? prev : next, isRtl ? next : prev);

  const trackFocus = (event: FocusEvent<HTMLDivElement>) => {
    setFocused(
      event.currentTarget.contains(event.target) &&
        event.target.matches(":focus-visible"),
    );
  };

  return (
    <div
      ref={ref}
      className="hero-cards"
      dir={isRtl ? "rtl" : "ltr"}
      role="region"
      aria-roledescription="carousel"
      aria-label={copy.region}
      onFocusCapture={trackFocus}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const towardEnd = (event.key === "ArrowLeft") === isRtl;
        if (towardEnd) next();
        else prev();
      }}
    >
      <div
        className="hero-cards-stage"
        onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        onPointerCancel={swipe.onPointerCancel}
        onClickCapture={swipe.onClickCapture}
      >
        {cards.map((card, index) => {
          const offset = signedOffset(index, active, cards.length);
          const previous = signedOffset(index, from, cards.length);
          return (
            <HeroCard
              key={card.src}
              card={card}
              position={index + 1}
              offset={offset}
              wrapping={Math.abs(offset - previous) > 1}
              turned={turned}
              onSelect={() => goTo(index)}
              onTurn={turn}
            />
          );
        })}
      </div>
    </div>
  );
}
