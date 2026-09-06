"use client";
import "./orders-page.css";

import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { productCopy } from "@/lib/catalog/products";
import { formatTotal } from "@/lib/money";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { useCatalog } from "@/components/catalog";
import { SHOP_STAGE_KEY, SHOP_STAGES, shopStageIndex } from "./const";

function OrderTimeline({
  activeStage,
  stages,
  number,
  label,
  currentLabel,
}: {
  activeStage: number;
  stages: string[];
  number: (value: number) => string;
  label: string;
  currentLabel: string;
}) {
  return (
    <ol className="order-progress" aria-label={label}>
      {stages.map((stage, index) => {
        const done = index < activeStage;
        const current = index === activeStage;
        return (
          <li
            key={stage}
            className={current ? "current" : done ? "complete" : ""}
            aria-current={current ? "step" : undefined}
          >
            <i>{number(index + 1)}</i>
            <span>
              {stage}
              {current ? <b>{currentLabel}</b> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrdersPage() {
  const { orders } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const { getProduct } = useCatalog();
  const stages = SHOP_STAGES.map((stage) => t(SHOP_STAGE_KEY[stage]));

  return (
    <section className="orders-page section">
      <header className="orders-heading">
        <span className="eyebrow">{t("ordersEyebrow")}</span>
        <h1>{t("ordersTitle")}</h1>
        <p>{t("ordersShopNote")}</p>
        <ButtonLink href="/making" outline>
          {t("makingNav")}
        </ButtonLink>
      </header>
      {orders.length ? (
        <div className="orders-list">
          {orders.map((order) => {
            const activeStage = shopStageIndex(order.status);
            const usdTotal =
              order.usdTotal ??
              order.slugs.reduce(
                (sum, slug) => sum + (getProduct(slug)?.usdPrice ?? 0),
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
                <p className="order-stage-now">
                  {t("currentStage")}: {stages[activeStage]} ·{" "}
                  {t("stageOf", {
                    current: number(activeStage + 1),
                    total: number(stages.length),
                  })}
                </p>
                <OrderTimeline
                  activeStage={activeStage}
                  stages={stages}
                  number={number}
                  label={t("orderProgress")}
                  currentLabel={t("youAreHere")}
                />
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
                  {formatTotal(locale === "fa" ? order.total : usdTotal, locale)}
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
          <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
        </div>
      )}
    </section>
  );
}
