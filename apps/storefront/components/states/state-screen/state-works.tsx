"use client";

import Link from "next/link";
import { useId } from "react";
import type { Product } from "@rad/types";
import { ProductMedia } from "@/components/product/listing";
import { useLocale } from "@/components/i18n";
import { productCopy } from "@/lib/catalog/products";

/** A short row of real, currently available works to continue from. */
export function StateWorks({ title, products }: { title: string; products: Product[] }) {
  const { locale, href } = useLocale();
  const titleId = useId();
  if (!products.length) return null;
  return (
    <nav className="state-works" aria-labelledby={titleId}>
      <h2 id={titleId} className="state-footer-title">
        {title}
      </h2>
      <ul>
        {products.map((product) => (
          <li key={product.slug}>
            <Link href={href(`/products/${product.slug}`)}>
              <span className="state-works-media">
                <ProductMedia product={product} showStatusBadge={false} />
              </span>
              <span className="state-works-name">{productCopy(product, locale).name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
