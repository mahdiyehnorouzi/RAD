"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  MapPin,
  PackageSearch,
  Tag,
  Truck,
  WalletCards,
} from "lucide-react";
import type { Order, Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ProductMedia } from "@/components/product";
import { productCopy } from "@/lib/catalog/products";
import { formatTotal } from "@/lib/money";
import {
  ORDER_STATUS_TONE,
  STORE_ORDER_STATUS_KEY,
  formatShippingAddress,
  orderDetailCopy,
  radArtworkNumber,
} from "../const";

const TONE_ICON = { wait: Clock3, go: CircleCheck, stop: CircleX };

export function OrderSummary({
  order,
  items,
  products,
  total,
  progressHref,
  formatDate,
}: {
  order: Order;
  items: Product[];
  products: Product[];
  total: number;
  progressHref: string;
  formatDate: (value: number) => string;
}) {
  const { locale, t, number } = useLocale();
  const c = orderDetailCopy[locale];
  const tone = ORDER_STATUS_TONE[order.status];
  const StatusIcon = TONE_ICON[tone];
  const Forward = locale === "fa" ? ChevronLeft : ChevronRight;

  const facts = [
    { icon: Tag, label: t("orderId"), value: order.id, ltr: true },
    { icon: CalendarDays, label: t("orderDate"), value: formatDate(order.createdAt) },
    { icon: WalletCards, label: t("orderTotal"), value: formatTotal(total, locale) },
    {
      icon: MapPin,
      label: t("shippingAddress"),
      value: formatShippingAddress(order.delivery) || "—",
      soft: true,
    },
    ...(order.trackingCode
      ? [{ icon: PackageSearch, label: t("trackingCode"), value: order.trackingCode, ltr: true }]
      : []),
    ...(order.estimatedDeliveryAt
      ? [{ icon: Truck, label: t("estimatedDelivery"), value: formatDate(order.estimatedDeliveryAt) }]
      : []),
  ];

  const status = (
    <span className={`track-status is-${tone}`}>
      <StatusIcon aria-hidden="true" />
      {t(STORE_ORDER_STATUS_KEY[order.status])}
    </span>
  );

  return (
    <article className="track-card track-summary">
      {items.length ? null : status}

      <ul className="track-works">
        {items.map((product, index) => (
          <li className="track-work" key={product.slug}>
            <div className="track-work-art">
              <ProductMedia product={product} showStatusBadge={false} />
            </div>
            <div className="track-work-copy">
              {index === 0 ? status : null}
              <h2>{productCopy(product, locale).name}</h2>
              <p>
                {t("artworkNumber")}:{" "}
                <b dir="ltr">{radArtworkNumber(product.slug, products)}</b>
              </p>
              <p>{c.quantity.replace("{count}", number(1))}</p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="track-facts">
        {facts.map(({ icon: Icon, label, value, ltr, soft }) => (
          <div key={label} className={soft ? "is-soft" : undefined}>
            <dt>
              <Icon aria-hidden="true" />
              {label}
            </dt>
            <dd dir={ltr ? "ltr" : undefined}>{value}</dd>
          </div>
        ))}
      </dl>

      <a className="track-cta" href={progressHref}>
        <span>{c.viewProgress}</span>
        <Forward aria-hidden="true" />
      </a>
    </article>
  );
}
