import type { Product } from "@rad/types";
import { isPurchasableStatus } from "@rad/types";
import { pendingOrderForSlug, useCart } from "@/features/cart";
import { useLocale } from "@/components/i18n";
import {
  isReserved,
  productStatusLabelKey,
} from "@/lib/catalog/product-status";

/**
 * Status as this visitor should see it. A work in your own bag is held as
 * `sold` for everyone else, so for you it reads "in your bag" instead, and a
 * work held in someone else's bag reads "reserved" rather than "sold".
 */
export function useProductStatus(
  product: Pick<Product, "slug" | "status" | "reservedUntil">,
) {
  const { has, pendingOrders, ready } = useCart();
  const { t } = useLocale();
  const inBag = has(product.slug);
  const ownOrder = pendingOrderForSlug(pendingOrders, product.slug);
  const ownOrderId = ownOrder?.id ?? null;
  const status = product.status;
  const reserved = !inBag && !ownOrderId && isReserved(product);
  const purchasable = !inBag && !ownOrderId && isPurchasableStatus(status);
  const label = ownOrderId
    ? t("reservedForYou")
    : inBag
      ? t("inBag")
      : reserved
        ? t("statusReserved")
        : status
          ? t(productStatusLabelKey[status])
          : null;
  return {
    status,
    inBag,
    reserved,
    /** True only after the bag has loaded, so this visitor's order is not described as someone else's. */
    heldByOther: ready && reserved,
    ownOrderId,
    purchasable,
    label,
    /** Badge only when the work is not simply for sale. */
    badge:
      inBag || !status || (status === "available" && !ownOrderId)
        ? null
        : label,
  };
}
