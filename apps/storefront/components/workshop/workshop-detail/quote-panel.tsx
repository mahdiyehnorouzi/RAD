"use client";

import type {FormEvent} from "react";
import { asCopy } from "@/lib/making";
import type {MakingCommission} from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";

export function QuotePanel({ commission }: { commission: MakingCommission }) {
  const { artistSendQuote } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "quote") return null;
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const priceToman = Number(data.get("priceToman"));
        const priceUsd = Number(data.get("priceUsd"));
        const depositToman = Number(data.get("depositToman"));
        const depositUsd = Number(data.get("depositUsd"));
        artistSendQuote(commission.id, {
          specification: asCopy(String(data.get("specification") ?? "")),
          artistName: commission.artistName,
          priceToman,
          priceUsd,
          depositToman,
          depositUsd,
          completionWindow: asCopy(String(data.get("window") ?? "")),
          includedRevisions: Number(data.get("revisions") || 1),
          cancellationRules: asCopy(String(data.get("cancel") ?? "")),
          createdAt: Date.now(),
        });
      }}
    >
      <h2>{locale === "fa" ? "نوشتن پیشنهاد" : "Write the proposal"}</h2>
      <label htmlFor="specification">{locale === "fa" ? "مشخصات نهایی" : "Final specification"}</label>
      <textarea
        id="specification"
        name="specification"
        className="resize-none"
        required
        defaultValue={commission.brief.concept}
      />
      <label htmlFor="priceToman">{locale === "fa" ? "قیمت (تومان)" : "Price (toman)"}</label>
      <input id="priceToman" name="priceToman" type="number" defaultValue={18400000} />
      <label htmlFor="priceUsd">{locale === "fa" ? "قیمت (دلار)" : "Price (USD)"}</label>
      <input id="priceUsd" name="priceUsd" type="number" defaultValue={220} />
      <label htmlFor="depositToman">{locale === "fa" ? "بیعانه (تومان)" : "Deposit (toman)"}</label>
      <input id="depositToman" name="depositToman" type="number" defaultValue={9200000} />
      <label htmlFor="depositUsd">{locale === "fa" ? "بیعانه (دلار)" : "Deposit (USD)"}</label>
      <input id="depositUsd" name="depositUsd" type="number" defaultValue={110} />
      <label htmlFor="window">{locale === "fa" ? "پنجره تکمیل" : "Completion window"}</label>
      <input
        id="window"
        name="window"
        defaultValue={locale === "fa" ? "چهار تا شش هفته از بیعانه" : "Four to six weeks from deposit"}
      />
      <label htmlFor="revisions">{locale === "fa" ? "تعداد بازبینی شامل" : "Included revisions"}</label>
      <input id="revisions" name="revisions" type="number" defaultValue={1} />
      <label htmlFor="cancel">{locale === "fa" ? "لغو و استرداد" : "Cancellation and refunds"}</label>
      <textarea
        id="cancel"
        name="cancel"
        className="resize-none"
        defaultValue={
          locale === "fa"
            ? "پیش از کوره، بیعانه پس از کسر مواد قابل استرداد است. پس از کوره برگشت‌ناپذیر است."
            : "Before the kiln, the deposit is refundable minus materials. After kiln entry it is not refundable."
        }
      />
      <button className="button" type="submit">
        {locale === "fa" ? "ارسال پیشنهاد برای مشتری" : "Send proposal to the customer"}
      </button>
    </form>
  );
}
