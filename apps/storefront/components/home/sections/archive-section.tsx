"use client";
import type { Product } from "@rad/types";
import { ProductCard, ProductGridSkeleton } from "@/components/product";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { useInView } from "../hooks";
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
  return (
    <section
      ref={ref}
      className={`section collection archive-section home-reveal${inView ? " is-visible" : ""}`}
    >
      <header className="section-heading">
        <div>
          <span className="eyebrow reveal-item" data-reveal="eyebrow">
            {t("archiveEyebrow")}
          </span>
          <h2 className="reveal-item" data-reveal="heading">
            {t("archiveTitle")}
          </h2>
          <p className="reveal-item" data-reveal="body">
            {t("archiveBody")}
          </p>
        </div>
        <div className="reveal-item" data-reveal="cta">
          <ButtonLink href="/products" outline>
            {t("homeArchiveLink")}
          </ButtonLink>
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
    </section>
  );
}
