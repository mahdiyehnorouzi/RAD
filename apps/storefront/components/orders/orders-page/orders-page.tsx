"use client";

import { PackageCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState, Eyebrow, PageSection } from "@/components/ui/section";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { useLocale } from "@/components/i18n";
import { useOrderStages } from "@/hooks/use-order-stage";
import { orderStageKeys } from "@/i18n/catalog";
import { OrderCard } from "./order-card";

export function OrdersPage() {
  const { orders } = useCommerce();
  const { t } = useLocale();
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
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              stages={stages}
              activeStage={activeStages[order.id] ?? 0}
            />
          ))}
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
