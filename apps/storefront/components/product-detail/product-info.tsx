"use client";

import { AddToBag } from "@/components/product/add-to-bag";
import { FavoriteButton } from "@/components/product/favorite-button";
import { Eyebrow } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";
import { productCopy, type Product } from "@/lib/products";
import { categoryLabel } from "@/lib/artwork";

export function ProductInfo({ product }: { product: Product }) {
  const { locale, t } = useLocale();
  const { productPrice } = useMoney();
  const copy = productCopy(product, locale);
  const category = categoryLabel(product.category, locale);

  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>
        {category} · {t("uniqueAvailable")}
      </Eyebrow>
      <h1 className="m-0 text-h2 font-normal">{copy.name}</h1>
      <p className="m-0 text-lede text-rad-muted">{copy.subtitle}</p>
      <p className="text-price">{productPrice(product)}</p>
      <p className="text-prose">{copy.story}</p>
      <FavoriteButton slug={product.slug} />
      <ul className="m-0 list-disc ps-5 text-prose">
        {copy.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
      <AddToBag product={product} />
      <p className="text-sm text-rad-muted">{t("shipping")}</p>
    </div>
  );
}
