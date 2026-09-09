"use client";
import type { Product } from "@rad/types";
import { ProductCard, ProductGridSkeleton } from "@/components/product";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { useInView, useStickyPin } from "../hooks";
import "../motion/reveal.css";
import "./archive-section.css";

export function ArchiveSection({
  products,
  loading = false,
}: {
  products: Product[];
  loading?: boolean;
}) {
  const { t } = useLocale();
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.16 });
  const { ref: pinSentinelRef, pinned } = useStickyPin<HTMLDivElement>();
  return (
    <section
      ref={ref}
      className={`section collection archive-section home-reveal${inView ? " is-visible" : ""}`}
    >
      <div
        aria-hidden="true"
        className="archive-heading-sentinel"
        ref={pinSentinelRef}
      />
      <div className="archive-pin-scope">
        <header className={`section-heading${pinned ? " is-pinned" : ""}`}>
          <div className="archive-heading-pin">
            <span className="eyebrow reveal-item" data-reveal="eyebrow">
              {t("archiveEyebrow")}
            </span>
            <div className="reveal-item" data-reveal="cta">
              <h2 className="reveal-item" data-reveal="heading">
                {t("archiveTitle")}
              </h2>
              <ButtonLink href="/products" outline>
                {t("homeArchiveLink")}
              </ButtonLink>
            </div>
          </div>
        </header>
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="product-grid home-products">
            {products.map((product, index) => (
              <ProductCard product={product} index={index} key={product.slug} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
