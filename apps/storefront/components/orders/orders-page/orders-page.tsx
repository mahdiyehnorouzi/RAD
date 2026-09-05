"use client";

import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { productCopy } from "@/lib/catalog";
import { formatTotal } from "@/lib/money";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { useOrderStages } from "@/hooks/use-order-stage";
import { useCatalog } from "@/components/catalog";

function OrderTimeline({ activeStage, stages, number, label }: { activeStage: number; stages: string[]; number: (value: number) => string; label: string }) {
  return <ol className="order-progress" aria-label={label}>{stages.map((stage, index) => <li key={stage} className={index <= activeStage ? "complete" : ""} aria-current={index === activeStage ? "step" : undefined}><i>{number(index + 1)}</i><span>{stage}</span></li>)}</ol>;
}

export function OrdersPage() {
  const { orders } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const { getProduct } = useCatalog();

  const stages = locale === "fa" ? ["تأیید طرح", "انتخاب هنرمند", "انتخاب متریال", "نمونه اولیه", "ساخت", "پرداخت نهایی", "کنترل کیفیت", "امضا و شماره ۱/۱", "بسته‌بندی", "ارسال"] : ["Concept approved", "Maker selected", "Material selected", "First study", "Making", "Final finish", "Quality check", "Signed 1/1", "Packed", "Shipped"];
  const activeStages = useOrderStages(orders, stages.length);

  return (
    <section className="orders-page section">
      <header className="orders-heading">
        <span className="eyebrow">{t("ordersEyebrow")}</span>
        <h1>{t("ordersTitle")}</h1>
      </header>
      {orders.length ? (
        <div className="orders-list">
          {orders.map((order) => {
            const activeStage = activeStages[order.id] ?? 0;
            const usdTotal =
              order.usdTotal ??
              order.slugs.reduce(
                (sum, slug) =>
                  sum +
                  (getProduct(slug)?.usdPrice ?? 0),
                0,
              );
            return (
              <article className="order-card" key={order.id}>
                <header>
                  <div>
                    <PackageCheck aria-hidden="true" />
                    <span>{t("orderId")}</span>
                    <b dir="ltr">{order.id}</b>
                  </div>
                  <span className="order-status">{stages[activeStage]}</span>
                </header>
                <OrderTimeline activeStage={activeStage} stages={stages} number={number} label={t("orderProgress")} />
                <dl>
                  <div>
                    <dt>{t("orderDate")}</dt>
                    <dd>
                      {new Intl.DateTimeFormat(
                        locale === "fa" ? "fa-IR" : "en-US",
                        { dateStyle: "medium" },
                      ).format(order.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("orderItems")}</dt>
                    <dd>{number(order.slugs.length)}</dd>
                  </div>
                </dl>
                <ul>
                  {order.slugs.map((slug) => {
                    const product = getProduct(slug);
                    return product ? (
                      <li key={slug}>
                        <Link href={href(`/products/${slug}`)}>
                          {productCopy(product, locale).name}
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
                <strong>
                  {formatTotal(
                    locale === "fa" ? order.total : usdTotal,
                    locale,
                  )}
                </strong>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <PackageCheck aria-hidden="true" />
          <h2>{t("noOrders")}</h2>
          <p>{t("noOrdersBody")}</p>
          <ButtonLink href="/products">
            {t("viewWorks")}
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
