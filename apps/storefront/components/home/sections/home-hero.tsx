"use client";

import { ArtworkVisual } from "@/components/product/artwork-visual";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/catalog/artwork";
import type {Product} from "@rad/types";

export function HomeHero({ product }: { product?: Product }) {
  const { t } = useLocale();
  return (
    <section className="hero section">
      <div className="hero-copy">
        <h1>
          {t("heroTitle1")}
          <br />
          {t("heroTitle2")}
        </h1>
        <p className="hero-thesis">{t("heroThesis")}</p>
      </div>
      <div className="hero-art">
        <div className="hero-identifier" aria-hidden="true">
          <span>RĀD / 027</span>
          <span>{t("tehranSlashYear")}</span>
        </div>
        <span className="one-badge">
          <b>{t("oneOfOne")}</b>
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
