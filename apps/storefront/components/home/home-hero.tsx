"use client";

import "@/components/product/artwork.css";
import { ArtworkVisual } from "@/components/product/artwork-visual";
import { PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/artwork";
import type { Product } from "@/lib/products";

export function HomeHero({ product }: { product?: Product }) {
  const { t } = useLocale();
  return (
    <PageSection className="grid items-center gap-4 bg-rad-paper py-[clamp(3.5rem,7vw,7rem)] md:grid-cols-[minmax(280px,0.72fr)_minmax(420px,1.28fr)]">
      <div className="self-center">
        <h1 className="m-0 max-w-[10ch] text-hero font-normal leading-[1.22] text-rad-moss">
          {t("heroTitle1")}
          <br />
          {t("heroTitle2")}
        </h1>
        <p className="mt-[clamp(1.5rem,3vw,2.75rem)] max-w-[27ch] text-lede text-rad-muted">
          {t("heroThesis")}
        </p>
      </div>
      <div className="hero-art-shell relative grid min-h-[clamp(560px,65vw,790px)] aspect-[4/5] place-items-center overflow-hidden bg-[color-mix(in_srgb,theme(colors.rad.sand)_74%,theme(colors.rad.paper))] max-md:mx-auto max-md:w-full max-md:max-w-[680px]">
        <div
          className="absolute start-6 top-6 z-[3] text-identifier tracking-[0.12em]"
          aria-hidden="true"
        >
          <span>RĀD / 027</span>
          <span className="ms-3">{t("tehranSlashYear")}</span>
        </div>
        <span className="absolute bottom-8 end-8 z-[3] flex aspect-square w-24 flex-col items-center justify-center rounded-full bg-rad-ink text-[0.7rem] text-white">
          <b className="text-xl font-normal">{t("oneOfOne")}</b>
        </span>
        <span className="absolute aspect-square w-3/5 rounded-full bg-rad-clay/30" />
        {product ? (
          <ArtworkVisual
            visual={artworkVisual(product)}
            color={product.color}
            accent={product.accent}
            shape={product.shape}
          />
        ) : null}
      </div>
    </PageSection>
  );
}
