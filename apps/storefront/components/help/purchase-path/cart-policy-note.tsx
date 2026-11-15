"use client";
import "./purchase-path.css";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { policyPath, purchasePathCopy } from "../const";

/** In the bag summary: how a ready work is sent. */
export function CartPolicyNote() {
  const { locale, href } = useLocale();
  const c = purchasePathCopy[locale];

  return (
    <section className="cart-policy-note" aria-label={c.cartRules}>
      <p className="cart-policy-final">{c.cartFinal}</p>
      <Link className="cart-policy-link" href={href(policyPath("shipping"))}>
        {c.cartRules}
      </Link>
    </section>
  );
}
