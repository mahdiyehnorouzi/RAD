"use client";
import type { Product } from "@rad/types";
import { ProductCard } from "@/components/product";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import "./archive-section.css";

export function ArchiveSection({ products }: { products: Product[] }) {
  const { locale, t } = useLocale();
  return (
    <section className="section collection archive-section">
      <header className="section-heading">
        <div>
          <span className="eyebrow">{locale === "fa" ? "آرشیو رَد" : "RAD ARCHIVE"}</span>
          <h2>{locale === "fa" ? "آثار موجود و فروخته‌شده" : "Available and collected works"}</h2>
          <p>
            {locale === "fa"
              ? "اثر فروخته‌شده از آرشیو حذف نمی‌شود؛ مسیر رَد را کامل می‌کند."
              : "Collected works remain visible; they complete RAD's story."}
          </p>
        </div>
        <ButtonLink href="/products" outline>
          {t("allWorks")}
        </ButtonLink>
      </header>
      <div className="product-grid home-products">
        {products.map((p, i) => (
          <ProductCard product={p} index={i} key={p.slug} />
        ))}
      </div>
    </section>
  );
}
