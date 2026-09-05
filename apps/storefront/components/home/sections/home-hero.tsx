"use client";
import type { Product } from "@rad/types";
import { ArtworkVisual } from "@/components/product";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/catalog";
import "./home-hero.css";

export function HomeHero({ product }: { product?: Product }) {
  const { t, locale } = useLocale();
  return (
    <section className="hero section">
      <div className="hero-copy">
        <h1>
          {t("heroTitle1")}
          <br />
          {t("heroTitle2")}
        </h1>
        <p className="hero-thesis">
          {locale === "fa" ? "یک اثر. یک ردِ دست. یک بار." : "One work. One maker's trace. Made once."}
        </p>
      </div>
      <div className="hero-art">
        <div className="hero-identifier" aria-hidden="true">
          <span>RĀD / 027</span>
          <span>{locale === "fa" ? "تهران / ۱۴۰۵" : "TEHRAN / 2026"}</span>
        </div>
        <span className="one-badge">
          <b>{locale === "fa" ? "۱ / ۱" : "1 / 1"}</b>
        </span>
        <span className="sun-disc" />
        {product ? (
          <ArtworkVisual
            visual={artworkVisual(product)}
            color={product.color}
            accent={product.accent}
            shape={product.shape}
          />
        ) : null}
      </div>
    </section>
  );
}
