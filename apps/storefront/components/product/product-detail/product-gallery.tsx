"use client";

import { useState } from "react";
import { ProductMedia } from "../listing";
import { useLocale } from "@/components/i18n";
import type {Product} from "@rad/types";

export function ProductGallery({ product }: { product: Product }) {
  const { t, number } = useLocale();
  const [activeImage, setActiveImage] = useState(0);
  const imageCount = product.images?.length ?? 1;

  return (
    <div className="grid gap-4">
      <div className="relative grid min-h-[420px] place-items-center overflow-hidden bg-[color-mix(in_srgb,theme(colors.rad.sand)_74%,theme(colors.rad.paper))]">
        <span className="absolute bottom-5 start-5 z-[3] grid h-12 w-12 place-items-center rounded-full border border-current bg-rad-paper/80 text-caption">
          {t("editionMark")}
        </span>
        <ProductMedia product={product} imageIndex={activeImage} />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: Math.max(imageCount, 1) }, (_, index) => (
          <button
            key={index}
            type="button"
            className={`relative h-20 w-20 shrink-0 overflow-hidden border ${
              activeImage === index ? "border-rad-clay" : "border-rad-line"
            }`}
            onClick={() => setActiveImage(index)}
            aria-label={`${t("imageNumber")} ${number(index + 1)}`}
          >
            <ProductMedia product={product} imageIndex={index} />
          </button>
        ))}
      </div>
    </div>
  );
}
