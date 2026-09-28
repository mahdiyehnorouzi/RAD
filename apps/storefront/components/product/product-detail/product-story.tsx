"use client";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { productCopy } from "@/lib/catalog/products";
import { formatRadDigits, ProductMedia } from "../listing";
import { pdpCopy } from "./const";
import { MaterialTexture } from "./material-texture";
import { PdpSection } from "./pdp-section";

export function ProductStory({
  product,
  textures,
}: {
  product: Product;
  textures: WorkTexture[];
}) {
  const { locale, number } = useLocale();
  const c = pdpCopy[locale];
  const story = productCopy(product, locale).story;
  const hasFigure = (product.images?.length ?? 0) > 1;

  if (!story && !hasFigure) return null;

  return (
    <PdpSection id="pdp-story-title" title={c.aboutTitle} className="pdp-story">
      {product.radNumber ? (
        <span className="pdp-story-number" aria-hidden="true">
          {formatRadDigits(product.radNumber, number, locale)}
        </span>
      ) : null}
      <MaterialTexture
        texture={textures[0]}
        shape="strip"
        className="pdp-story-strip"
      />
      {story ? <p>{story}</p> : null}
      {hasFigure ? (
        <figure className="pdp-story-figure">
          <ProductMedia
            product={product}
            imageIndex={1}
            showStatusBadge={false}
          />
        </figure>
      ) : null}
    </PdpSection>
  );
}
