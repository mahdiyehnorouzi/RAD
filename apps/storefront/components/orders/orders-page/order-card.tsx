"use client";

import Link from "next/link";
import { PackageCheck } from "lucide-react";
import type {Order} from "@rad/types";
import { productCopy } from "@/lib/catalog/products";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";
import { OrderTimeline } from "./order-timeline";

export function OrderCard({
  order,
  stages,
  activeStage,
}: {
  order: Order;
  stages: string[];
  activeStage: number;
}) {
  const { locale, t, href, number } = useLocale();
  const { getProduct } = useCatalog();
  const { formatTotal } = useMoney();
  const usdTotal =
    order.usdTotal ??
    order.slugs.reduce((sum, slug) => sum + (getProduct(slug)?.usdPrice ?? 0), 0);

  return (
    <article className="border border-rad-line bg-rad-paper p-6">
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
          <dt className="text-caption text-rad-muted">{t("orderDate")}</dt>
          <dd className="m-0">
            {new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
              dateStyle: "medium",
            }).format(order.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-rad-muted">{t("orderItems")}</dt>
          <dd className="m-0">{number(order.slugs.length)}</dd>
        </div>
      </dl>
      <ul className="my-4">
        {order.slugs.map((slug) => {
          const product = getProduct(slug);
          return product ? (
            <li key={slug}>
              <Link href={href(`/products/${slug}`)}>{productCopy(product, locale).name}</Link>
            </li>
          ) : null;
        })}
      </ul>
      <strong className="text-price font-normal">
        {formatTotal(locale === "fa" ? order.total : usdTotal)}
      </strong>
    </article>
  );
}
