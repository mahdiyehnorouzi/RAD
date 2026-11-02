"use client";
import type { ReactNode } from "react";
import type { Product } from "@rad/types";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { EmptyBagState } from "@/components/states";
import { pendingOrderForSlug } from "./bag-sync";
import { useCart } from "./cart-provider";
import styles from "./cart-empty.module.css";

/** The empty bag, shared by the bag page and a checkout that lost its works. */
export function CartEmpty({
  suggestions,
  released,
}: {
  suggestions: Product[];
  released?: ReactNode;
}) {
  const { t } = useLocale();
  const { pendingOrders } = useCart();
  const openOrders = (pendingOrders ?? []).filter(
    (order) => pendingOrderForSlug([order], order.slugs[0] ?? "") !== null,
  );
  const next = [...openOrders].sort(
    (a, b) => (a.paymentDueAt ?? Infinity) - (b.paymentDueAt ?? Infinity),
  )[0];
  return (
    <section className={`${styles.empty} section`}>
      <EmptyBagState
        suggestions={suggestions}
        title={next ? t("pendingOrderBagTitle") : undefined}
        body={next ? t("pendingOrderBagBody") : undefined}
        actions={
          next ? (
            <>
              <ButtonLink href={`/checkout/${encodeURIComponent(next.id)}`}>
                {t("resumePayment")}
              </ButtonLink>
              {openOrders.length > 1 ? (
                <ButtonLink href="/orders" outline>
                  {t("viewOrders")}
                </ButtonLink>
              ) : null}
            </>
          ) : undefined
        }
        notice={
          released ? <div className={styles.released}>{released}</div> : null
        }
      />
    </section>
  );
}
