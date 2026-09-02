"use client";

import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";

export function CheckoutSummary({ count, total }: { count: number; total: number }) {
  const { t, number } = useLocale();
  const { formatTotal } = useMoney();
  return (
    <aside className="flex flex-col gap-2 border border-rad-line bg-rad-paper p-6">
      <span>
        {number(count)} {t("availableWorks")}
      </span>
      <b className="text-price font-normal">{formatTotal(total)}</b>
    </aside>
  );
}
