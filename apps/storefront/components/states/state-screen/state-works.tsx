"use client";

import { useId } from "react";
import type { Product } from "@rad/types";
import { ProductCard } from "@/components/product/listing";

/** A short row of real, currently available works to continue from. */
export function StateWorks({ title, products }: { title: string; products: Product[] }) {
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
            <ProductCard product={product} variant="suggest" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
