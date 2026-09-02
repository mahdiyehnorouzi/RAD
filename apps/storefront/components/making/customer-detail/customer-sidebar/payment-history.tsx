"use client";

import type {MakingCommission} from "@/components/making/type";
import { moneyFor } from "@/lib/making";
import { formatWhen } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function PaymentHistory({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  if (!commission.payments.length) return null;
  return (
    <ul className="making-payments">
      {commission.payments.map((item) => (
        <li key={item.id} className={item.status}>
          <b>
            {item.kind === "deposit"
              ? locale === "fa"
                ? "بیعانه"
                : "Deposit"
              : locale === "fa"
                ? "مانده حساب"
                : "Balance"}
          </b>
          <span>{moneyFor(commission, locale, item.amountToman, item.amountUsd)}</span>
          <small>
            {item.status === "paid"
              ? `${locale === "fa" ? "پرداخت‌شده" : "Paid"}${item.at ? ` · ${formatWhen(item.at, locale)}` : ""}`
              : locale === "fa"
                ? "سررسید"
                : "Due"}
          </small>
        </li>
      ))}
    </ul>
  );
}
