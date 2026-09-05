"use client";

import { asCopy } from "@/lib/making";
import type {MakingCommission} from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";

export function FiringPanel({ commission }: { commission: MakingCommission }) {
  const { artistRecordFiring } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "firing" || commission.firing) return null;
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const unexpected = data.get("unexpected") === "on";
        artistRecordFiring(commission.id, {
          firingNote: asCopy(String(data.get("firing") ?? "")),
          finishingNote: asCopy(String(data.get("finishing") ?? "")),
          qcNote: asCopy(String(data.get("qc") ?? "")),
          unexpected,
          resolution: unexpected ? asCopy(String(data.get("resolution") ?? "")) : undefined,
          createdAt: Date.now(),
        });
      }}
    >
      <h2>{locale === "fa" ? "ثبت پخت و پرداخت" : "Record firing and finishing"}</h2>
      <label htmlFor="firing">{locale === "fa" ? "پخت" : "Firing"}</label>
      <textarea id="firing" name="firing" className="resize-none" required />
      <label htmlFor="finishing">{locale === "fa" ? "پرداخت" : "Finishing"}</label>
      <textarea id="finishing" name="finishing" className="resize-none" />
      <label htmlFor="qc">{locale === "fa" ? "کنترل کیفیت" : "Quality control"}</label>
      <textarea id="qc" name="qc" className="resize-none" />
      <label className="making-check">
        <input type="checkbox" name="unexpected" />
        {locale === "fa"
          ? "نتیجه از بازه تأییدشده فاصله گرفته است"
          : "Result differs materially from the approved range"}
      </label>
      <label htmlFor="resolution">{locale === "fa" ? "پیشنهاد حل اختلاف" : "Resolution proposal"}</label>
      <textarea id="resolution" name="resolution" className="resize-none" />
      <button className="button" type="submit">
        {locale === "fa" ? "ثبت نتیجه پخت" : "Record firing result"}
      </button>
    </form>
  );
}
