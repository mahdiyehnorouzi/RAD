"use client";
import "./purchase-path.css";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { policyPath, purchasePathCopy } from "../const";
import { PolicyFacts } from "./policy-facts";

/** Under the buy button: shipping, returns and after-sales in one fold. */
export function ShippingReturnsDisclosure({
  className,
}: {
  className?: string;
}) {
  const { locale, href } = useLocale();
  const c = purchasePathCopy[locale];

  return (
    <details
      className={["purchase-disclosure", className].filter(Boolean).join(" ")}
    >
      <summary>
        <span className="purchase-disclosure-head">
          <strong>{c.disclosureTitle}</strong>
          <span>{c.disclosureTeaser}</span>
        </span>
        <ChevronDown size={18} strokeWidth={1.6} aria-hidden="true" />
      </summary>
      <div className="purchase-disclosure-body">
        <PolicyFacts
          facts={[
            { slug: "shipping", id: "cost" },
            { slug: "shipping", id: "tehran" },
            { slug: "shipping", id: "cities" },
            { slug: "returns", id: "window", review: true },
            { slug: "returns", id: "damage" },
            { slug: "returns", id: "compensation" },
          ]}
        />
        <p className="purchase-links">
          <Link href={href(policyPath("shipping"))}>{c.fullShipping}</Link>
          <Link href={href(policyPath("returns"))}>{c.fullReturns}</Link>
        </p>
      </div>
    </details>
  );
}
