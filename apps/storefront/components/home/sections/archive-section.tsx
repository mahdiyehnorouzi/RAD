"use client";

import { ProductCard, ProductGrid } from "@/components/product";
import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import type {Product} from "@rad/types";

export function ArchiveSection({ products }: { products: Product[] }) {
  const { t } = useLocale();
  return (
    <PageSection className="bg-[color-mix(in_srgb,theme(colors.rad.sand)_24%,theme(colors.rad.canvas))]">
      <header className="mb-14 flex flex-col items-start gap-[clamp(1.25rem,3vw,2rem)]">
        <div>
          <Eyebrow>{t("archiveEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h2 font-normal">{t("archiveTitle")}</h2>
          <p className="mt-3 max-w-xl text-prose">{t("archiveBody")}</p>
        </div>
        <ButtonLink href="/products" outline>
          {t("allWorks")}
        </ButtonLink>
      </header>
      <ProductGrid>
        {products.map((product, index) => (
          <ProductCard product={product} index={index} key={product.slug} />
        ))}
      </ProductGrid>
    </PageSection>
  );
}
