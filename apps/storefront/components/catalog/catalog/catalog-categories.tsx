"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ProductMedia } from "@/components/product/listing";
import { ArtworkVisual } from "@/components/product/artwork-visual";
import { artworkCategories } from "@/lib/catalog/artwork";
import { categoryChipLabels } from "../const";

/** The work that stands for a category: something still for sale, else anything shown. */
function representative(products: Product[], category?: string) {
  const pool = category
    ? products.filter((product) => product.category === category)
    : products;
  return pool.find((product) => product.status === "available") ?? pool[0];
}

export function CatalogCategories({
  products,
  active,
  onSelect,
}: {
  products: Product[];
  active: string;
  onSelect: (category: string) => void;
}) {
  const { t, locale } = useLocale();
  const railRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const chips = [
    { id: "all", label: t("filterAll"), work: representative(products) },
    ...artworkCategories.map((category) => ({
      id: category.id,
      label: (categoryChipLabels[category.id] ?? category.shortLabel)[locale],
      work: representative(products, category.id),
      preview: category,
    })),
  ];

  useEffect(() => {
    const node = railRef.current;
    if (!node) return undefined;
    const sync = () =>
      setOverflowing(node.scrollWidth > node.clientWidth + 2);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`plp-categories${overflowing ? " is-overflowing" : ""}`}>
      <div
        ref={railRef}
        className="plp-chip-rail"
        role="group"
        aria-label={t("filterCategoriesAria")}
      >
        {chips.map((chip) => {
          const selected = active === chip.id;
          return (
            <button
              type="button"
              key={chip.id}
              className={`plp-chip${selected ? " active" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(chip.id)}
            >
              <span className="plp-chip-thumb" aria-hidden="true">
                {chip.work ? (
                  <ProductMedia
                    product={chip.work}
                    showStatusBadge={false}
                    sizes="45px"
                  />
                ) : "preview" in chip && chip.preview ? (
                  <ArtworkVisual
                    visual={chip.preview.visual}
                    color={chip.preview.preview.color}
                    accent={chip.preview.preview.accent}
                  />
                ) : null}
              </span>
              <span className="plp-chip-label">{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
