"use client";
import "./purchase-path.css";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { policyPath, purchasePathCopy } from "../const";
import { PolicyFacts } from "./policy-facts";

/** In the bag summary: what the total covers and when the work arrives. */
export function CartPolicyNote() {
  const { locale, href } = useLocale();
  const c = purchasePathCopy[locale];

  return (
    <section className="cart-policy-note" aria-label={c.cartArrival}>
      <p className="cart-policy-final">{c.cartFinal}</p>
      <p className="cart-policy-arrival">{c.cartArrival}</p>
      <PolicyFacts
        facts={[
          { slug: "shipping", id: "tehran" },
          { slug: "shipping", id: "cities" },
        ]}
      />
      <Link className="cart-policy-link" href={href(policyPath("shipping"))}>
        {c.cartRules}
      </Link>
    </section>
  );
}
