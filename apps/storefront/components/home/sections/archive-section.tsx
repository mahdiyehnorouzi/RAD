"use client";
import type { Product } from "@rad/types";
import { ProductCard, ProductGridSkeleton } from "@/components/product";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import "./archive-section.css";

export function ArchiveSection({
  products,
  loading = false,
}: {
  products: Product[];
  loading?: boolean;
}) {
  const { t } = useLocale();
  return (
    <section className="section collection archive-section">
      <header className="section-heading">
        <div>
          <span className="eyebrow">{t("archiveEyebrow")}</span>
          <h2>{t("archiveTitle")}</h2>
          <p>{t("archiveBody")}</p>
        </div>
        <ButtonLink href="/products" outline>
          {t("homeArchiveLink")}
        </ButtonLink>
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
