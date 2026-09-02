"use client";

import type {MakingCommission} from "@/components/making/type";
import { useLocale } from "@/components/i18n";

export function PreKilnPanel({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  if (commission.stage !== "pre_kiln") return null;
  return (
    <p className="making-empty">
      {locale === "fa"
        ? "منتظر تأیید مشتری برای کوره. این مرحله برگشت‌ناپذیر خواهد شد."
        : "Waiting for the customer to approve the kiln. This step will become irreversible."}
    </p>
  );
}
