"use client";
import "./order-detail.css";

import { useEffect, useState } from "react";
import type { Order } from "@rad/types";
import { fetchOrder, errorMessage } from "@/lib/api";
import { productCopy } from "@/lib/catalog/products";
import { formatTotal } from "@/lib/money";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ProductMedia } from "@/components/product";
import { useCatalog } from "@/components/catalog";
import { AccountShell } from "../../account/account-shell";
import { CardListSkeleton } from "@/components/ui/skeleton";
import {
  STORE_ORDER_PROGRESS,
  STORE_ORDER_STATUS_KEY,
  formatShippingAddress,
  radArtworkNumber,
} from "../const";
import { OrderTimeline } from "./order-timeline";
import { OrderNextAction } from "./order-next-action";

function formatDate(value: number, locale: "fa" | "en") {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    dateStyle: "medium",
  }).format(value);
}

export function OrderDetail({ id }: { id: string }) {
  const { orders, confirmDemoPayment, cancelOrder } = useCommerce();
  const { locale, t, number } = useLocale();
  const { products, getProduct } = useCatalog();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetched, setFetched] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);

  const order = orders.find((item) => item.id === id) ?? fetched;

  useEffect(() => {
    if (orders.some((item) => item.id === id)) {
      setReady(true);
      return;
    }
    let cancelled = false;
    fetchOrder(id)
      .then((payload) => {
        if (!cancelled) setFetched(payload);
      })
      .catch(() => {
        if (!cancelled) setFetched(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, orders]);

  if (!ready && !order) {
    return (
      <AccountShell>
        <section className="order-detail section">
          <CardListSkeleton count={1} />
        </section>
      </AccountShell>
    );
  }

  if (!order) {
    return (
      <AccountShell>
        <section className="order-detail section">
          <h1>{t("orderMissing")}</h1>
        </section>
      </AccountShell>
    );
  }

  const stages = STORE_ORDER_PROGRESS.map((stage) => t(STORE_ORDER_STATUS_KEY[stage]));
  const usdTotal =
    order.usdTotal ??
    order.slugs.reduce((sum, slug) => sum + (getProduct(slug)?.usdPrice ?? 0), 0);
  const items = order.slugs
    .map((slug) => getProduct(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const run = async (action: () => Promise<unknown>) => {
    try {
      setBusy(true);
      setError("");
      await action();
    } catch (err) {
      setError(errorMessage(err, t("requestFailed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountShell>
    <section className="order-detail section">
      <header className="order-detail-heading">
        <span className="eyebrow">{t("ordersEyebrow")}</span>
        <h1>{t("trackOrder")}</h1>
        <p>{t("ordersShopNote")}</p>
      </header>
      <article className="order-card order-detail-card">
        {items.map((product) => (
          <div className="order-artwork" key={product.slug}>
            <div className="order-art">
              <ProductMedia product={product} showStatusBadge={false} />
            </div>
            <div>
              <span>{t("uniquePiece")}</span>
              <h2>{productCopy(product, locale).name}</h2>
              <p>
                {t("artworkNumber")}: {radArtworkNumber(product.slug, products)}
              </p>
            </div>
          </div>
        ))}
        <dl>
          <div>
            <dt>{t("orderId")}</dt>
            <dd dir="ltr">{order.id}</dd>
          </div>
          <div>
            <dt>{t("orderDate")}</dt>
            <dd>{formatDate(order.createdAt, locale)}</dd>
          </div>
          <div>
            <dt>{t("orderTotal")}</dt>
            <dd>{formatTotal(locale === "fa" ? order.total : usdTotal, locale)}</dd>
          </div>
          <div>
            <dt>{t("orderStatus")}</dt>
            <dd>{t(STORE_ORDER_STATUS_KEY[order.status])}</dd>
          </div>
          <div>
            <dt>{t("shippingAddress")}</dt>
            <dd>{formatShippingAddress(order.delivery) || "—"}</dd>
          </div>
          {order.trackingCode ? (
            <div>
              <dt>{t("trackingCode")}</dt>
              <dd dir="ltr">{order.trackingCode}</dd>
            </div>
          ) : null}
          {order.estimatedDeliveryAt ? (
            <div>
              <dt>{t("estimatedDelivery")}</dt>
              <dd>{formatDate(order.estimatedDeliveryAt, locale)}</dd>
            </div>
          ) : null}
        </dl>
        {order.status !== "cancelled" && order.status !== "returned" ? (
          <OrderTimeline
            status={order.status}
            stages={stages}
            number={number}
            label={t("orderProgress")}
            currentLabel={t("youAreHere")}
          />
        ) : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <OrderNextAction
          order={order}
          busy={busy}
          onConfirmPayment={() => run(() => confirmDemoPayment(order.id))}
          onCancel={() => run(() => cancelOrder(order.id))}
        />
      </article>
    </section>
    </AccountShell>
  );
}
