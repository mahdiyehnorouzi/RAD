import { productCopy } from "@/lib/catalog/products";
import { copy, STAGE_LABEL } from "@/lib/making";
import { useCatalog } from "@/components/catalog";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { useMaking } from "@/hooks/use-making-workspace";
import { STORE_ORDER_STATUS_KEY } from "../../orders/const";
import type { MakingStageId } from "@/components/making/type";
import type { AccountActivityItem } from "../type";

function artistReviewStage(stage: MakingStageId) {
  return stage === "design_submitted" || stage === "feasibility";
}

export function useAccountActivity(limit = 8): AccountActivityItem[] {
  const { orders } = useCommerce();
  const { commissions } = useMaking();
  const { getProduct } = useCatalog();
  const { locale, t } = useLocale();

  const shop: AccountActivityItem[] = orders.map((order) => {
    const product = getProduct(order.slugs[0] ?? "");
    return {
      id: `shop-${order.id}`,
      kind: "collection",
      title: product
        ? productCopy(product, locale).name
        : order.id,
      status: t(STORE_ORDER_STATUS_KEY[order.status]),
      href: `/orders/${order.id}`,
      at: order.createdAt,
    };
  });

  const custom: AccountActivityItem[] = commissions.map((commission) => ({
    id: `custom-${commission.id}`,
    kind: "custom",
    title: copy(commission.title, locale),
    status: artistReviewStage(commission.stage)
      ? t("commissionArtistReview")
      : copy(STAGE_LABEL[commission.stage], locale),
    href: `/making/${commission.id}`,
    at: commission.updatedAt || commission.createdAt,
  }));

  return [...shop, ...custom]
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}
