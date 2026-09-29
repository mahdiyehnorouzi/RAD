"use client";
import { useEffect, useRef } from "react";
import { Check, CircleSlash } from "lucide-react";
import type { Order } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { checkoutCopy } from "../const";

const CLOSED = ["expired", "rejected", "cancelled", "returned"] as const;

export function PaymentResult({ order, amount }: { order: Order; amount: string }) {
  const { locale } = useLocale();
  const c = checkoutCopy[locale];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const closed = (CLOSED as readonly string[]).includes(order.status);
  const reviewing = order.status === "pending_verification";

  useEffect(() => {
    headingRef.current?.focus();
  }, [order.status]);

  const title = closed
    ? order.status === "expired"
      ? c.closedExpiredTitle
      : order.status === "rejected"
        ? c.closedRejectedTitle
        : c.closedCancelledTitle
    : reviewing
      ? c.doneTitle
      : c.confirmedTitle;
  const body = closed
    ? order.status === "expired"
      ? c.closedExpiredBody
      : order.status === "rejected"
        ? c.closedRejectedBody
        : c.closedCancelledBody
    : reviewing
      ? c.doneBody
      : c.confirmedBody;

  return (
    <section className={`payment-result${closed ? " is-closed" : ""}`}>
      <span className="payment-result-seal" aria-hidden="true">
        {closed ? <CircleSlash /> : <Check />}
      </span>
      <h1 ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      <p>{body}</p>
      {order.status === "rejected" && order.payment?.rejectionReason ? (
        <p className="payment-result-reason">{order.payment.rejectionReason}</p>
      ) : null}

      <dl className="payment-result-facts">
        <div>
          <dt>{c.orderLabel}</dt>
          <dd dir="ltr">{order.id}</dd>
        </div>
        {order.payment?.trackingNumber ? (
          <div>
            <dt>{c.trackingSaved}</dt>
            <dd dir="ltr">{order.payment.trackingNumber}</dd>
          </div>
        ) : null}
        <div>
          <dt>{c.paidLabel}</dt>
          <dd>{amount}</dd>
        </div>
      </dl>

      {reviewing ? <p className="payment-result-next">{c.doneNext}</p> : null}

      <div className="payment-result-actions">
        <ButtonLink href={`/orders/${encodeURIComponent(order.id)}`}>{c.trackOrder}</ButtonLink>
        <ButtonLink href="/products" outline>
          {c.moreWorks}
        </ButtonLink>
      </div>
    </section>
  );
}
