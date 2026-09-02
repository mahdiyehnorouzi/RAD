"use client";

import { ArtworkVisual } from "@/components/product/artwork-visual";
import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/artwork";
import type { Product } from "@/lib/products";

export function StudioCallout({ product }: { product?: Product }) {
  const { t } = useLocale();
  return (
    <PageSection className="grid items-center gap-[8vw] bg-rad-moss text-rad-paper md:grid-cols-2">
      <div className="relative grid h-[600px] place-items-center">
        <span className="absolute h-[55%] w-[85%] rounded-full border border-white/30" />
        <span className="absolute h-[85%] w-[55%] rounded-full border border-white/30" />
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
        <Eyebrow className="text-rad-sand">{t("studioEyebrow")}</Eyebrow>
        <h2 className="m-0 text-h2 font-normal">{t("studioImagineTitle")}</h2>
        <p className="my-8 max-w-xl text-lede">{t("studioImagineBody")}</p>
        <ButtonLink href="/studio" light>
          {t("enterStudio")}
        </ButtonLink>
      </div>
    </PageSection>
  );
}
