"use client";

import { Clock } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { formatCountdown } from "@/lib/catalog/product-status";
import { useCountdown } from "@/hooks/use-countdown";
import { cartCopy } from "../const";

/** How long the bag stays reserved, counting down to the earliest hold. */
export function CartHold({
  endsAt,
  count,
}: {
  endsAt: number | null;
  count: number;
}) {
  const { locale, number } = useLocale();
  const c = cartCopy[locale];
  const remaining = useCountdown(endsAt);
  if (remaining === null) return null;
  const [before, after] = c.holdBody.split("{time}");

  return (
    <div className="cart-hold" role="status" aria-live="off">
      <Clock className="cart-hold-icon" aria-hidden="true" />
      <div>
        <b>{count > 1 ? c.holdTitleMany : c.holdTitleOne}</b>
        <p>
          {before}
          <span className="cart-hold-time" dir="ltr">
            {formatCountdown(remaining, locale, number)}
          </span>
          {after}
        </p>
      </div>
    </div>
  );
}
