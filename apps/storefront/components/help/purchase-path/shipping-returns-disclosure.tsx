"use client";
import "./purchase-path.css";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { policyPath, purchasePathCopy } from "../const";
import { PolicyFacts } from "./policy-facts";

/** Shipping and returns facts. The PDP section around this is the only fold. */
export function ShippingReturnsDisclosure({
  className,
}: {
  className?: string;
}) {
  const { locale, href } = useLocale();
  const c = purchasePathCopy[locale];

  return (
    <div className={className}>
      <PolicyFacts
        facts={[
          { slug: "shipping", id: "cost" },
          { slug: "shipping", id: "tehran" },
          { slug: "shipping", id: "cities" },
          { slug: "returns", id: "window" },
          { slug: "returns", id: "damage" },
          { slug: "returns", id: "compensation" },
        ]}
      />
      <p className="purchase-links">
        <Link href={href(policyPath("shipping"))}>{c.fullShipping}</Link>
        <Link href={href(policyPath("returns"))}>{c.fullReturns}</Link>
      </p>
    </div>
  );
}
