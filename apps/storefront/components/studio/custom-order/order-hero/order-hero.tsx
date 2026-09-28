"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { orderCopy } from "../../const";
import { HeroSketch } from "./hero-sketch";
import { OrderFacts } from "./order-facts";

export function OrderHero() {
  const { locale } = useLocale();
  const c = orderCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <section className="co-section co-hero" aria-labelledby="custom-order-title">
      <div className="co-inner co-hero-grid">
        <div className="co-hero-copy">
          <h1 id="custom-order-title">{c.heroTitle}</h1>
          <p className="co-hero-lede">{c.heroLede}</p>
          <a className="button co-hero-cta" href="#your-idea">
            <span>{c.heroCta}</span>
            <Arrow className="button-arrow" aria-hidden="true" size={18} strokeWidth={1.6} />
          </a>
          <p className="co-hero-note">{c.heroNote}</p>
        </div>
        <HeroSketch
          alt={c.heroSketchAlt}
          sketchLabel={c.heroSketchLabel}
          resultLabel={c.heroResultLabel}
        />
      </div>

      <div className="co-inner">
        <OrderFacts title={c.factsTitle} />
      </div>
    </section>
  );
}
