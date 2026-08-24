"use client";

import Link from "next/link";
import { Check, PackageCheck } from "lucide-react";
import { products, productCopy } from "@/lib/products";
import { formatTotal } from "./cart";
import { type Order, useCommerce } from "./commerce";
import { useLocale } from "./i18n";

const demoStageDuration = 60_000;
const stageFor = (order: Order) => Math.min(3, Math.floor((Date.now() - order.createdAt) / demoStageDuration));

export function OrdersPage() {
  const { orders } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const stages = [t("orderReceived"), t("orderProcessing"), t("orderShipped"), t("orderDelivered")];
  return <section className="orders-page section">
    <header className="orders-heading"><span className="eyebrow">{t("ordersEyebrow")}</span><h1>{t("ordersTitle")}</h1></header>
    {orders.length ? <div className="orders-list">{orders.map((order) => {
      const activeStage = stageFor(order);
      const usdTotal = order.usdTotal ?? order.slugs.reduce((sum, slug) => sum + (products.find((product) => product.slug === slug)?.usdPrice ?? 0), 0);
      return <article className="order-card" key={order.id}>
        <header><div><PackageCheck aria-hidden="true" /><span>{t("orderId")}</span><b dir="ltr">{order.id}</b></div><span className="order-status">{stages[activeStage]}</span></header>
        <ol className="order-progress" aria-label={t("orderProgress")}>{stages.map((stage, index) => <li key={stage} className={index <= activeStage ? "complete" : ""} aria-current={index === activeStage ? "step" : undefined}><i>{index < activeStage ? <Check aria-hidden="true" /> : number(index + 1)}</i><span>{stage}</span></li>)}</ol>
        <dl><div><dt>{t("orderDate")}</dt><dd>{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" }).format(order.createdAt)}</dd></div><div><dt>{t("orderItems")}</dt><dd>{number(order.slugs.length)}</dd></div></dl>
        <ul>{order.slugs.map((slug) => { const product = products.find((item) => item.slug === slug); return product ? <li key={slug}><Link href={href(`/products/${slug}`)}>{productCopy(product, locale).name}</Link></li> : null; })}</ul>
        <strong>{formatTotal(locale === "fa" ? order.total : usdTotal, locale)}</strong>
      </article>;
    })}</div> : <div className="empty-state"><PackageCheck aria-hidden="true" /><h2>{t("noOrders")}</h2><p>{t("noOrdersBody")}</p><Link className="button" href={href("/products")}>{t("viewWorks")}</Link></div>}
  </section>;
}
