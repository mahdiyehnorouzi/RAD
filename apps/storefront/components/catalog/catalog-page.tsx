"use client";

import type { Product } from "@rad/types";
import { Catalog } from "./catalog";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function CatalogPage({ products }: { products: Product[] }) {
  const { t } = useLocale();
  return (
    <PageSection className="plp">
      <header className="mb-4">
        <Eyebrow>{t("shopEyebrow")}</Eyebrow>
        <h1 className="m-0 text-h2 font-normal">{t("shopTitle")}</h1>
        <p className="mt-3 max-w-2xl text-prose">{t("shopBody")}</p>
      </header>
      <Catalog products={products} />
    </PageSection>
  );
}
