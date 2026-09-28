"use client";
import Link from "next/link";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { categoryLabel } from "@/lib/catalog/artwork";
import { productCopy } from "@/lib/catalog/products";
import { pdpCopy } from "./const";

export function ProductCrumbs({ product }: { product: Product }) {
  const { locale, href } = useLocale();
  const c = pdpCopy[locale];

  return (
    <nav className="pdp-crumbs" aria-label={c.breadcrumb}>
      <ol>
        <li>
          <Link href={href("/")}>{c.home}</Link>
        </li>
        <li>
          <Link href={href(`/products?category=${product.category}`)}>
            {categoryLabel(product.category, locale)}
          </Link>
        </li>
        <li aria-current="page">{productCopy(product, locale).name}</li>
      </ol>
    </nav>
  );
}
