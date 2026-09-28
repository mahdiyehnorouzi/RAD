"use client";

import type { Product } from "@rad/types";
import { ProductCard, ProductCarousel } from "./listing";
import "./product-card-showcase.css";

const PREFERRED = ["cobalt-fold-bowl", "spotted-loop-teapot", "cobalt-ripple-tray"];

/** Development reference: every card variant and badge state on real works. */
export function ProductCardShowcase({ products }: { products: Product[] }) {
  const pick = (slug: string, fallback: number) =>
    products.find((product) => product.slug === slug) ?? products[fallback];
  const lead = pick(PREFERRED[0], 0);
  const second = pick(PREFERRED[1], 1);
  const third = pick(PREFERRED[2], 2);
  if (!lead || !second || !third) return null;
  const sold: Product = { ...second, status: "sold", reservedUntil: undefined };
  const upcoming: Product = { ...third, status: "in_workshop" };
  const available: Product = { ...lead, status: "available" };

  return (
    <section className="section card-showcase">
      <h1>Product cards</h1>

      <div className="card-showcase-row is-hero">
        <figure>
          <ProductCard product={available} variant="featured" popular />
          <figcaption>featured · home, desktop</figcaption>
        </figure>
        <figure>
          <ProductCard product={sold} variant="standard" />
          <figcaption>standard · home, favourites</figcaption>
        </figure>
      </div>

      <div className="card-showcase-row is-split">
        <figure>
          <ProductCarousel
            products={products.slice(0, 6)}
            label="Similar works"
          />
          <figcaption>compact in the carousel · product page</figcaption>
        </figure>
        <figure>
          <div className="card-showcase-pair">
            <ProductCard product={third} variant="suggest" />
            <ProductCard product={upcoming} variant="suggest" />
          </div>
          <figcaption>suggest · empty and error states</figcaption>
        </figure>
      </div>

      <h2>Badge states</h2>
      <div className="card-showcase-row is-badges">
        <figure>
          <ProductCard product={sold} variant="compact" />
          <figcaption>sold</figcaption>
        </figure>
        <figure>
          <ProductCard product={available} variant="compact" popular />
          <figcaption>popular (only when passed)</figcaption>
        </figure>
        <figure>
          <ProductCard product={upcoming} variant="compact" />
          <figcaption>neutral · in the workshop</figcaption>
        </figure>
        <figure>
          <ProductCard product={{ ...third, status: "available" }} variant="compact" />
          <figcaption>none · add it to the bag to see “in bag”</figcaption>
        </figure>
      </div>
    </section>
  );
}
