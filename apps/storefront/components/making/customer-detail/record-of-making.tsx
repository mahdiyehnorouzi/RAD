"use client";

import type {MakingCommission} from "@/components/making/type";
import { copy } from "@/lib/making";
import { useLocale } from "@/components/i18n";
import { PreKilnCard, ProgressPhotographs, QuoteCard } from "../record";
import { StageMessages } from "./customer-sidebar/stage-messages";

export function RecordOfMaking({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  return (
    <section className="making-record">
      <header>
        <span className="eyebrow">
          {locale === "fa" ? "رکورد ساخت" : "Record of Making"}
        </span>
        <h2>{copy(commission.title, locale)}</h2>
        <p>
          {locale === "fa"
            ? "گفت‌وگو، تصمیم‌ها، مرجع لعاب، نتیجه پخت و عکس‌ها زندگی‌نامه این قطعه هستند."
            : "Conversation, decisions, glaze reference, firing result, and photographs are this piece’s biography."}
        </p>
      </header>
      {commission.tracking ? (
        <p className="making-tracking">
          {locale === "fa" ? "رهگیری ارسال" : "Shipment tracking"}: {commission.tracking}
        </p>
      ) : null}
      <QuoteCard commission={commission} snapshot />
      <PreKilnCard commission={commission} />
      {commission.firing ? (
        <dl className="making-firing">
          <div>
            <dt>{locale === "fa" ? "پخت" : "Firing"}</dt>
            <dd>{copy(commission.firing.firingNote, locale)}</dd>
          </div>
          <div>
            <dt>{locale === "fa" ? "پرداخت" : "Finishing"}</dt>
            <dd>{copy(commission.firing.finishingNote, locale)}</dd>
          </div>
          <div>
            <dt>{locale === "fa" ? "کنترل کیفیت" : "Quality control"}</dt>
            <dd>{copy(commission.firing.qcNote, locale)}</dd>
          </div>
        </dl>
      ) : null}
      <ProgressPhotographs commission={commission} />
      <StageMessages commission={commission} />
    </section>
  );
}
