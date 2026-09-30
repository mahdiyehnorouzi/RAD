"use client";

import { MapPin, MessageSquareText } from "lucide-react";
import type { Order } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { orderDetailCopy } from "../const";
import { OrderSprig } from "./order-sprig";

const ADDRESS_OPEN: Order["status"][] = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "packing",
];

export function OrderAddress({
  order,
  helpHref,
}: {
  order: Order;
  helpHref: string;
}) {
  const { locale, t } = useLocale();
  const c = orderDetailCopy[locale];
  const { name, city, address, phone } = order.delivery;
  const place = [address, city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("، ");

  return (
    <section
      className="track-card track-address"
      aria-labelledby="track-address-title"
    >
      <OrderSprig />
      <h2 id="track-address-title" className="track-kicker">
        <MapPin aria-hidden="true" />
        {t("shippingAddress")}
      </h2>
      <address>
        {place ? <span>{place}</span> : null}
        {name ? <span>{name}</span> : null}
        {phone ? <span dir="ltr">{phone}</span> : null}
        {!place && !name ? <span>—</span> : null}
      </address>
      {ADDRESS_OPEN.includes(order.status) ? (
        <a className="track-chip" href={helpHref}>
          <MessageSquareText aria-hidden="true" />
          {c.addressChange}
        </a>
      ) : null}
    </section>
  );
}
