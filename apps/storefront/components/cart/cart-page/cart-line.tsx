"use client";

import Link from "next/link";
import type {Product} from "@rad/types";
import { ProductMedia } from "@/components/product";
import { productCopy } from "@/lib/catalog/products";
import { useCart } from "@/components/cart/cart-provider";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";

export function CartLine({ product }: { product: Product }) {
  const { locale, t, href } = useLocale();
  const { remove } = useCart();
  const { productPrice } = useMoney();
  return (
    <article className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[96px_minmax(0,1fr)_auto]">
      <Link
        href={href(`/products/${product.slug}`)}
        className="relative grid h-24 w-24 place-items-center overflow-hidden bg-rad-sand"
      >
        <ProductMedia product={product} />
      </Link>
      <div>
        <span className="text-caption text-rad-muted">{t("uniquePiece")}</span>
        <h2 className="m-0 text-lg font-normal">
          <Link href={href(`/products/${product.slug}`)}>{productCopy(product, locale).name}</Link>
        </h2>
        <p className="m-0 text-sm text-rad-muted">{productCopy(product, locale).subtitle}</p>
        <button
          className="mt-2 border-0 border-b border-current bg-transparent text-sm"
          onClick={() => remove(product.slug)}
        >
          {t("removeBag")}
        </button>
      </div>
      <strong className="text-price font-normal max-sm:col-start-2">{productPrice(product)}</strong>
    </article>
  );
}
