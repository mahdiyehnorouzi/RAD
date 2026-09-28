"use client";
import "./purchase-path.css";

import Link from "next/link";
import type { StoreOrderStatus } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ORDER_STATUS_GUIDE, policyPath, purchasePathCopy } from "../const";

/** What the order's current status means for the buyer, and the rule behind it. */
export function OrderStatusGuide({ status }: { status: StoreOrderStatus }) {
  const { locale, href } = useLocale();
  const c = purchasePathCopy[locale];
  const guide = ORDER_STATUS_GUIDE[status];

  return (
    <section
      className="order-status-guide"
      aria-labelledby="order-status-guide-title"
    >
      <h2 id="order-status-guide-title">{c.statusGuideTitle}</h2>
      <strong>{guide.title[locale]}</strong>
      <p>{guide.body[locale]}</p>
      <Link href={href(policyPath(guide.slug, guide.section))}>
        {c.statusGuideMore}
      </Link>
    </section>
  );
}
