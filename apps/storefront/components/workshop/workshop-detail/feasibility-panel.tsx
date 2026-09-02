"use client";

import { asCopy } from "@/lib/making";
import type {MakingCommission} from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";

export function FeasibilityPanel({ commission }: { commission: MakingCommission }) {
  const { artistDecide } = useMaking();
  const { locale } = useLocale();
  const open =
    commission.stage === "design_submitted" ||
    (commission.stage === "feasibility" &&
      commission.nextActor === "artist" &&
      !commission.changeRequests.some((item) => item.status === "open"));
  if (!open) return null;
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const decision = String(data.get("decision"));
        if (decision === "approve") artistDecide(commission.id, "approve");
        if (decision === "decline") {
          artistDecide(commission.id, "decline", {
            reason: asCopy(
              String(data.get("reason") ?? "").trim() ||
                (locale === "fa"
                  ? "این طرح با ماده فعلی سازگار نیست."
                  : "This design does not fit the current material."),
            ),
          });
        }
        if (decision === "alternative") {
          artistDecide(commission.id, "offer_alternative", {
            alternative: asCopy(String(data.get("alternative") ?? "").trim()),
          });
        }
        if (decision === "change") {
          artistDecide(commission.id, "request_change", {
            change: {
              whatChanged: asCopy(String(data.get("what") ?? "")),
              whyNecessary: asCopy(String(data.get("why") ?? "")),
              priceImpact: asCopy(String(data.get("price") ?? "")),
              timeImpact: asCopy(String(data.get("time") ?? "")),
            },
          });
        }
      }}
    >
      <h2>{locale === "fa" ? "بازبینی امکان‌پذیری" : "Feasibility review"}</h2>
      <label htmlFor="decision">{locale === "fa" ? "تصمیم" : "Decision"}</label>
      <select id="decision" name="decision" defaultValue="approve">
        <option value="approve">{locale === "fa" ? "تأیید طرح" : "Approve the design"}</option>
        <option value="change">{locale === "fa" ? "درخواست تغییر مشخص" : "Request a specific change"}</option>
        <option value="alternative">{locale === "fa" ? "پیشنهاد بدیل" : "Offer an alternative"}</option>
        <option value="decline">{locale === "fa" ? "رد با دلیل" : "Decline with a reason"}</option>
      </select>
      <label htmlFor="what">{locale === "fa" ? "چه چیزی عوض می‌شود" : "What changes"}</label>
      <textarea id="what" name="what" className="resize-none" />
      <label htmlFor="why">{locale === "fa" ? "چرا لازم است" : "Why it is necessary"}</label>
      <textarea id="why" name="why" className="resize-none" />
      <label htmlFor="price">{locale === "fa" ? "اثر بر قیمت" : "Price effect"}</label>
      <input id="price" name="price" />
      <label htmlFor="time">{locale === "fa" ? "اثر بر زمان" : "Delivery effect"}</label>
      <input id="time" name="time" />
      <label htmlFor="alternative">{locale === "fa" ? "بدیل" : "Alternative"}</label>
      <textarea id="alternative" name="alternative" className="resize-none" />
      <label htmlFor="reason">{locale === "fa" ? "دلیل رد" : "Decline reason"}</label>
      <textarea id="reason" name="reason" className="resize-none" />
      <button className="button" type="submit">
        {locale === "fa" ? "ثبت تصمیم هنرمند" : "Record artist decision"}
      </button>
    </form>
  );
}
