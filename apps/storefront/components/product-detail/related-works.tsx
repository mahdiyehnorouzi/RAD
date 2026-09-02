"use client";

import { useRef } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useCatalog } from "@/components/catalog-provider";
import { useLocale } from "@/components/i18n";

export function RelatedWorks({ currentSlug }: { currentSlug: string }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const { products } = useCatalog();

  return (
    <PageSection>
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>{t("relatedEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h2 font-normal">{t("moreWorks")}</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="h-10 w-10 border border-rad-line bg-transparent"
            aria-label={t("previousWorks")}
            onClick={() =>
              carouselRef.current?.scrollBy({
                left: -carouselRef.current.clientWidth * 0.75,
                behavior: "smooth",
              })
            }
          >
            ←
          </button>
          <button
            type="button"
            className="h-10 w-10 border border-rad-line bg-transparent"
            aria-label={t("nextWorks")}
            onClick={() =>
              carouselRef.current?.scrollBy({
                left: carouselRef.current.clientWidth * 0.75,
                behavior: "smooth",
              })
            }
          >
            →
          </button>
        </div>
      </header>
      <div
        ref={carouselRef}
        className="flex gap-8 overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        {products
          .filter((item) => item.slug !== currentSlug)
          .map((item, index) => (
            <div key={item.slug} className="min-w-[min(280px,80vw)]">
              <ProductCard product={item} index={index} />
            </div>
          ))}
      </div>
    </PageSection>
  );
}
