"use client";

import { useState } from "react";
import type { Order } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { Button, ButtonLink } from "@/components/ui/button-link";

export function OrderNextAction({
  order,
  busy,
  onConfirmPayment,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onConfirmPayment: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const productHref = order.slugs[0] ? `/products/${order.slugs[0]}` : "/products";

  if (order.status === "payment_pending") {
    return (
      <div className="order-next">
        <p>{t("demoPaymentHint")}</p>
        <div className="order-next-actions">
          <Button type="button" onClick={onConfirmPayment} disabled={busy}>
            {t("confirmDemoPayment")}
          </Button>
          <Button type="button" outline onClick={onCancel} disabled={busy}>
            {t("cancelDemoOrder")}
          </Button>
        </div>
      </div>
    );
  }

  if (order.status === "confirmed") {
    return <p className="order-next">{t("waitingPacking")}</p>;
  }

  if (order.status === "packing") {
    return <p className="order-next">{t("waitingShip")}</p>;
  }

  if (order.status === "shipped") {
    return (
      <div className="order-next">
        <p>{t("waitingDelivery")}</p>
        {order.trackingCode ? (
          <Button
            type="button"
            outline
            onClick={async () => {
              await navigator.clipboard.writeText(order.trackingCode ?? "");
              setCopied(true);
            }}
          >
            {copied ? t("trackingCopied") : t("copyTracking")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (order.status === "delivered") {
    return (
      <div className="order-next">
        <p>{t("orderComplete")}</p>
        <ButtonLink href={productHref} outline>
          {t("leaveReview")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="order-next">
      <ButtonLink href="/products" outline>
        {t("nextActionBrowse")}
      </ButtonLink>
    </div>
  );
}
