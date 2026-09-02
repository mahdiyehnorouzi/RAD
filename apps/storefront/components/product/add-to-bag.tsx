"use client";

import { Button } from "@/components/ui/button-link";
import { useCart } from "@/components/cart/cart-provider";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { useLocale } from "@/components/i18n";
import type { Product } from "@/lib/products";

export function AddToBag({ product }: { product: Product }) {
  const { add, has } = useCart();
  const { t } = useLocale();
  const { addNotice } = useCommerce();
  const added = has(product.slug);
  const soldOut = product.status === "sold";
  return (
    <Button
      type="button"
      onClick={async () => {
        await add(product);
        await addNotice("cart", product.slug);
      }}
      disabled={
        added || product.status === "sold" || product.status === "reserved"
      }
      aria-live="polite"
    >
      {soldOut ? t("soldOut") : added ? t("inBag") : t("addBag")}
    </Button>
  );
}
