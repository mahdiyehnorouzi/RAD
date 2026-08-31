import type { Product, ProductImage } from "@rad/types";
export type { Product, ProductImage } from "@rad/types";

export const productCopy = (product: Product, locale: "fa" | "en") =>
  locale === "en"
    ? product.en
    : {
        name: product.name,
        subtitle: product.subtitle,
        story: product.story,
        details: product.details,
      };
