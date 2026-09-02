"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";

export function CartSummary({ total }: { total: number }) {
  const { t } = useLocale();
  const { formatTotal } = useMoney();
  return (
    <aside className="flex flex-col gap-4 border border-rad-line bg-rad-paper p-6">
      <span>{t("orderSummary")}</span>
      <div className="flex justify-between">
        <span>{t("worksSubtotal")}</span>
        <b className="font-medium">{formatTotal(total)}</b>
      </div>
      <div className="flex justify-between">
        <span>{t("insuredShipping")}</span>
        <b className="font-medium">{t("free")}</b>
      </div>
      <div className="flex justify-between border-t border-rad-line pt-3">
        <span>{t("finalTotal")}</span>
        <b className="font-medium">{formatTotal(total)}</b>
      </div>
      <ButtonLink href="/checkout">{t("checkout")}</ButtonLink>
      <small className="text-rad-muted">{t("checkoutNote")}</small>
    </aside>
  );
}
