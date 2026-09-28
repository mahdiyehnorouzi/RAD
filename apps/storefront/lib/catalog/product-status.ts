import type { Product, ProductStatus } from "@rad/types";
import type { MessageKey } from "@/i18n/fa";

/**
 * The only place the storefront turns an API `ProductStatus` into words.
 * Pages never derive status themselves; unknown status renders no label.
 */
export const productStatusLabelKey: Record<ProductStatus, MessageKey> = {
  draft: "statusUnavailable",
  in_workshop: "statusInWorkshop",
  ready: "statusReady",
  available: "statusAvailable",
  sold: "soldOut",
  archived: "statusArchived",
};

/** Works that belong on the shop floor; archived works live in the archive. */
export function isShopStatus(status?: ProductStatus) {
  return status !== "archived" && status !== "draft";
}

export function isUpcomingStatus(status?: ProductStatus) {
  return status === "in_workshop" || status === "ready";
}

export function isGoneStatus(status?: ProductStatus) {
  return status === "sold" || status === "archived";
}

/** A few works still for sale, leaving out ones the visitor already has in view. */
export function availableWorks(
  products: Product[],
  exclude: string[] = [],
  limit = 4,
) {
  return products
    .filter(
      (product) =>
        product.status === "available" && !exclude.includes(product.slug),
    )
    .slice(0, limit);
}

/** Held by a cart or unpaid checkout: shows as `sold` but may come back. */
export function isReserved(
  product: Pick<Product, "status" | "reservedUntil">,
  now = Date.now(),
) {
  return (
    product.status === "sold" &&
    Boolean(product.reservedUntil && product.reservedUntil > now)
  );
}

export function formatCountdown(
  ms: number,
  locale: "fa" | "en",
  number: (value: number) => string,
) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const zero = locale === "fa" ? "۰" : "0";
  return `${number(minutes)}:${number(seconds).padStart(2, zero)}`;
}
