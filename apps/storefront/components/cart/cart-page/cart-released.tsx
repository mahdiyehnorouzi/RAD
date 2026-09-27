"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@rad/types";
import { StateNotice } from "@/components/ui/state-panel";
import { useLocale } from "@/components/i18n";
import { productCopy } from "@/lib/catalog/products";
import { isGoneStatus, isReserved } from "@/lib/catalog/product-status";
import { isNetworkError } from "@/lib/api";

/** Works whose hold ran out since the visitor last saw the bag, and where each went. */
export function CartReleased({
  slugs,
  getProduct,
  onAdd,
  onDismiss,
}: {
  slugs: string[];
  getProduct: (slug: string) => Product | undefined;
  onAdd: (product: Product) => Promise<boolean>;
  onDismiss: () => void;
}) {
  const { t, locale, href } = useLocale();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<Record<string, string>>({});

  if (!slugs.length) return null;

  const addAgain = async (product: Product) => {
    setBusy(product.slug);
    setFailed((current) => ({ ...current, [product.slug]: "" }));
    try {
      await onAdd(product);
    } catch (err) {
      setFailed((current) => ({
        ...current,
        [product.slug]: isNetworkError(err)
          ? t("addBagNetwork")
          : t("addBagTaken"),
      }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <StateNotice
      className="cart-released"
      action={
        <button type="button" className="state-action" onClick={onDismiss}>
          {t("dismiss")}
        </button>
      }
    >
      <strong>{t("cartReleasedTitle")}</strong>
      <ul>
        {slugs.map((slug) => {
          const product = getProduct(slug);
          if (!product) {
            return (
              <li key={slug}>
                <b dir="ltr">{slug}</b> — {t("cartReleasedGone")}
              </li>
            );
          }
          const name = productCopy(product, locale).name;
          const available = product.status === "available";
          const reason = available
            ? t("cartReleasedAvailable")
            : isReserved(product)
              ? t("cartReleasedReserved")
              : isGoneStatus(product.status)
                ? t("cartReleasedSold")
                : t("statusUnavailable");
          return (
            <li key={slug}>
              <Link href={href(`/products/${slug}`)}>{name}</Link> — {reason}
              {available ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="state-action"
                    disabled={busy === slug}
                    onClick={() => void addAgain(product)}
                  >
                    {busy === slug ? t("submitting") : t("addAgain")}
                  </button>
                </>
              ) : null}
              {failed[slug] ? <small role="alert">{failed[slug]}</small> : null}
            </li>
          );
        })}
      </ul>
    </StateNotice>
  );
}
