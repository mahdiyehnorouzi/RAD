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
  const { ref: inViewRef, inView } = useInView<HTMLElement>({ threshold: 0.16 });
  const { containerRef, headingRef, pinned, barHeight } = useStickyPin();

  const setSectionRef = (node: HTMLElement | null) => {
    inViewRef.current = node;
    containerRef.current = node;
  };

  return (
    <section
      ref={setSectionRef}
      className={`section collection archive-section home-reveal${inView ? " is-visible" : ""}`}
    >
      <span className="eyebrow reveal-item" data-reveal="eyebrow">
        {t("archiveEyebrow")}
      </span>
      <header
        className={`section-heading${pinned ? " is-pinned" : ""}`}
        ref={headingRef}
      >
        <div className="archive-heading-pin">
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
      {loading && products.length === 0 ? (
        <ProductGridSkeleton />
      ) : (
        <div className="product-grid home-products">
          {products.map((product, index) => (
            <ProductCard product={product} index={index} key={product.slug} />
          ))}
        </div>
      )}
      {pinned ? (
        <div
          aria-hidden="true"
          className="archive-heading-blur"
          style={{ height: barHeight }}
        />
      ) : null}
    </section>
  );
}
