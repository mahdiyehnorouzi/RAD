"use client";

import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { productCopy } from "@/lib/products";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState, Eyebrow, PageSection } from "@/components/ui/section";
import { useCatalog } from "@/components/catalog-provider";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";
import { useOrderStages } from "@/hooks/use-order-stage";
import { orderStageKeys } from "@/i18n/catalog";

function OrderTimeline({
  activeStage,
  stages,
  number,
  label,
}: {
  activeStage: number;
  stages: string[];
  number: (value: number) => string;
  label: string;
}) {
  return (
    <ol className="my-6 grid gap-2 md:grid-cols-5" aria-label={label}>
      {stages.map((stage, index) => (
        <li
          key={stage}
          className={`flex items-center gap-2 text-sm ${index <= activeStage ? "text-rad-moss" : "text-rad-muted"}`}
          aria-current={index === activeStage ? "step" : undefined}
        >
          <i className="not-italic">{number(index + 1)}</i>
          <span>{stage}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrdersPage() {
  const { orders } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const { getProduct } = useCatalog();
  const { formatTotal } = useMoney();
  const stages = orderStageKeys.map((key) => t(key));
  const activeStages = useOrderStages(orders, stages.length);

  return (
    <PageSection>
      <header className="mb-10">
        <Eyebrow>{t("ordersEyebrow")}</Eyebrow>
        <h1 className="m-0 text-h2 font-normal">{t("ordersTitle")}</h1>
      </header>
      {orders.length ? (
        <div className="grid gap-8">
          {orders.map((order) => {
            const activeStage = activeStages[order.id] ?? 0;
            const usdTotal =
              order.usdTotal ??
              order.slugs.reduce(
                (sum, slug) => sum + (getProduct(slug)?.usdPrice ?? 0),
                0,
              );
            return (
              <article
                className="border border-rad-line bg-rad-paper p-6"
                key={order.id}
              >
                <header className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <PackageCheck aria-hidden="true" />
                    <span>{t("orderId")}</span>
                    <b className="font-medium" dir="ltr">
                      {order.id}
                    </b>
                  </div>
                  <span>{stages[activeStage]}</span>
                </header>
                <OrderTimeline
                  activeStage={activeStage}
                  stages={stages}
                  number={number}
                  label={t("orderProgress")}
                />
                <dl className="grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-caption text-rad-muted">
                      {t("orderDate")}
                    </dt>
                    <dd className="m-0">
                      {new Intl.DateTimeFormat(
                        locale === "fa" ? "fa-IR" : "en-US",
                        { dateStyle: "medium" },
                      ).format(order.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-caption text-rad-muted">
                      {t("orderItems")}
                    </dt>
                    <dd className="m-0">{number(order.slugs.length)}</dd>
                  </div>
                </dl>
                <ul className="my-4">
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
                <strong className="text-price font-normal">
                  {formatTotal(locale === "fa" ? order.total : usdTotal)}
                </strong>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title={t("noOrders")} body={t("noOrdersBody")}>
          <PackageCheck aria-hidden="true" />
          <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
        </EmptyState>
      )}
    </PageSection>
  );
}
