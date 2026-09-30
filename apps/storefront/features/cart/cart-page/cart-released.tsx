"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { RotateCcw, X } from "lucide-react";
import type { Product } from "@rad/types";
import { ProductMedia } from "@/components/product";
import { WatercolorWash } from "@/components/ui/watercolor-wash";
import { useLocale } from "@/components/i18n";
import { productCopy } from "@/lib/catalog/products";
import { isGoneStatus, isReserved } from "@/lib/catalog/product-status";
import { isNetworkError } from "@/lib/api";
import styles from "./cart-released.module.css";

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
  const titleId = useId();
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
    <section className={styles.released} aria-labelledby={titleId}>
      <WatercolorWash shape="corner" className={styles.wash} />
      <header className={styles.head}>
        <h2 id={titleId}>{t("cartReleasedTitle")}</h2>
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label={t("dismiss")}
          title={t("dismiss")}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <ul>
        {slugs.map((slug) => {
          const product = getProduct(slug);
          if (!product) {
            return (
              <li key={slug} className={styles.item}>
                <p>
                  <b dir="ltr">{slug}</b> — {t("cartReleasedGone")}
                </p>
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
            <li key={slug} className={styles.item}>
              <div>
                <p>
                  <Link href={href(`/products/${slug}`)}>{name}</Link> —{" "}
                  {reason}
                </p>
                {available ? (
                  <button
                    type="button"
                    className={styles.add}
                    disabled={busy === slug}
                    onClick={() => void addAgain(product)}
                  >
                    {busy === slug ? t("submitting") : t("addAgain")}
                    <RotateCcw aria-hidden="true" />
                  </button>
                ) : null}
                {failed[slug] ? (
                  <small role="alert">{failed[slug]}</small>
                ) : null}
              </div>
              <Link
                href={href(`/products/${slug}`)}
                className={styles.art}
                tabIndex={-1}
                aria-hidden="true"
              >
                <ProductMedia product={product} showStatusBadge={false} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
