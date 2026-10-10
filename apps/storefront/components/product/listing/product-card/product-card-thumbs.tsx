"use client";

import Link from "next/link";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { productCardCopy } from "../const";
import type { ProductCardSlide } from "../type";
import { ProductCardArtwork } from "./product-card-artwork";

/** Featured-card view rail; views past the rail are counted and lead to the work. */
export function ProductCardThumbs({
  product,
  slides,
  hidden,
  active,
  onSelect,
  productHref,
}: {
  product: Product;
  slides: ProductCardSlide[];
  hidden: number;
  active: number;
  onSelect: (index: number) => void;
  productHref: string;
}) {
  const { locale, number } = useLocale();
  const c = productCardCopy[locale];
  const format = (value: number) =>
    locale === "fa" ? number(value) : String(value);

  return (
    <div className="rad-card-thumbs" role="group" aria-label={c.views}>
      {slides.map((slide, index) => (
        <button
          key={slide.kind === "photo" ? slide.index : "plate"}
          type="button"
          className="rad-card-thumb"
          aria-pressed={index === active}
          aria-label={
            slide.kind === "plate" ? c.plate : `${c.view} ${format(index + 1)}`
          }
          onClick={() => onSelect(index)}
        >
          <ProductCardArtwork
            product={product}
            slide={slide}
            sizes="72px"
          />
        </button>
      ))}
      {hidden > 0 ? (
        <Link
          href={productHref}
          className="rad-card-thumb-more"
          aria-label={`${format(hidden)} ${c.moreViews}`}
        >
          <span dir="ltr">+{format(hidden)}</span>
        </Link>
      ) : null}
    </div>
  );
}
