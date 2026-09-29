"use client";
import "./order-detail.css";

import { useEffect, useState } from "react";
import type { Order } from "@rad/types";
import { fetchOrder, errorMessage } from "@/lib/api";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { useCatalog } from "@/components/catalog";
import { AccountShell } from "../../account/account-shell";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { HelpPanel } from "@/components/contact";
import { OrderPolicies, OrderStatusGuide } from "@/components/help";
import { NoAccessState, NotFoundState } from "@/components/states";
import {
  PAYMENT_HELP_STATUSES,
  STORE_ORDER_PROGRESS,
  STORE_ORDER_STATUS_KEY,
  isTerminalStoreStatus,
} from "../const";
import { OrderAddress } from "./order-address";
import { OrderNextAction } from "./order-next-action";
import { OrderSprig } from "./order-sprig";
import { OrderSummary } from "./order-summary";
import { OrderTimeline } from "./order-timeline";
import { DamageReportPanel } from "./damage-report";

function formatDate(value: number, locale: "fa" | "en") {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    dateStyle: "medium",
  }).format(value);
}

function formatTime(value: number, locale: "fa" | "en") {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function OrderDetail({ id }: { id: string }) {
  const { user, orders, confirmDemoPayment, cancelOrder } = useCommerce();
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
        {user ? (
          <NotFoundState
            title="orderMissing"
            body="orderMissingBody"
            primary={{ href: "/orders", label: "ordersTitle" }}
          />
        ) : (
          <NoAccessState returnTo={`/orders/${id}`} />
        )}
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

  const terminal = isTerminalStoreStatus(order.status);

  return (
    <AccountShell>
      <section className="order-detail section">
        <header className="track-heading">
          <OrderSprig />
          <span className="track-eyebrow">{t("ordersEyebrow")}</span>
          <h1>{t("trackOrder")}</h1>
          <p>{t("ordersShopNote")}</p>
        </header>

        <div className="track-layout">
          <div className="track-aside">
            <OrderSummary
              order={order}
              items={items}
              products={products}
              total={locale === "fa" ? order.total : usdTotal}
              progressHref={terminal ? "#order-next" : "#order-progress"}
              formatDate={(value) => formatDate(value, locale)}
            />
            <OrderAddress order={order} helpHref="#order-help" />
          </div>

          <div className="track-main">
            {!terminal ? (
              <OrderTimeline
                id="order-progress"
                order={order}
                stages={stages}
                number={number}
                label={t("orderProgress")}
                currentLabel={t("youAreHere")}
                formatTime={(value) => formatTime(value, locale)}
              />
            ) : null}
            <div className="track-decorated">
              <OrderStatusGuide status={order.status} />
              <OrderSprig />
            </div>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <OrderNextAction
              id="order-next"
              order={order}
              busy={busy}
              onConfirmPayment={(receipt) =>
                run(() => confirmDemoPayment(order.id, receipt))
              }
              onCancel={() => run(() => cancelOrder(order.id))}
            />
            <DamageReportPanel order={order} />
            {order.policyAcceptance ? (
              <OrderPolicies acceptance={order.policyAcceptance} />
            ) : null}
            <div id="order-help" className="track-decorated is-top">
              <HelpPanel
                context="order"
                orderId={order.id}
                tone={PAYMENT_HELP_STATUSES.includes(order.status) ? "payment" : "general"}
              />
              <OrderSprig />
            </div>
          </div>
        </div>
      </section>
    </AccountShell>
  );
}
