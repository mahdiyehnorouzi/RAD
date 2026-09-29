import { create } from "qrcode";
import { formatRadCode } from "@rad/types";
import type { Product } from "@rad/types";
import { FALLBACK_SITE_URL } from "./seo";

/**
 * Only the public origin, so server and browser renders draw the same code
 * and hydration never disagrees.
 */
const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL;

function publicPageUrl(path: string) {
  return new URL(path, PUBLIC_ORIGIN).toString();
}

/** The address printed on the work's label: its short `/r/NNN` link when numbered. */
export function workScanUrl(product: Pick<Product, "slug" | "radNumber">) {
  return publicPageUrl(
    product.radNumber
      ? `/r/${formatRadCode(product.radNumber)}`
      : `/products/${product.slug}`,
  );
}

/** One SVG path for the dark modules, merged into horizontal runs. */
export function qrModulePath(text: string) {
  const { size, data } = create(text, { errorCorrectionLevel: "L" }).modules;
  let d = "";
  for (let y = 0; y < size; y += 1) {
    let x = 0;
    while (x < size) {
      if (!data[y * size + x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < size && data[y * size + x]) x += 1;
      d += `M${start} ${y}h${x - start}v1h${start - x}z`;
    }
  }
  return { size, d };
}
