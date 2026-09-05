"use client";
import type { Product } from "@rad/types";
import { ArtworkVisual } from "@/components/product";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/catalog";
import "./studio-callout.css";

export function StudioCallout({ product }: { product?: Product }) {
  const { t, locale } = useLocale();
  return (
    <section className="studio-callout section">
      <div className="studio-visual">
        <span className="orbit o1" />
        <span className="orbit o2" />
        {product ? (
          <ArtworkVisual
            visual={artworkVisual(product)}
            color={product.color}
            accent={product.accent}
            shape={product.shape}
          />
        ) : null}
      </div>
      <div>
        <span className="eyebrow">{t("studioEyebrow")}</span>
        <h2>{locale === "fa" ? "چیزی را که هنوز وجود ندارد، تصور کن." : "Imagine what does not exist yet."}</h2>
        <p>{locale === "fa" ? "رَد کمک می‌کند آن را ببینی و بسازی." : "RAD helps you see it and make it."}</p>
        <ButtonLink href="/studio" light>
          {t("enterStudio")}
        </ButtonLink>
      </div>
    </section>
  );
}
