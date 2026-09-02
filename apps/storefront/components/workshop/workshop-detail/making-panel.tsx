"use client";

import { asCopy } from "@/lib/making";
import type {MakingCommission, PhotoKind} from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";

export function MakingUpdateForm({ commission }: { commission: MakingCommission }) {
  const { artistPublishUpdate } = useMaking();
  const { locale } = useLocale();
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        artistPublishUpdate(commission.id, {
          note: asCopy(String(data.get("note") ?? "")),
          photoKind: String(data.get("photo")) as PhotoKind,
        });
        event.currentTarget.reset();
      }}
    >
      <h2>{locale === "fa" ? "به‌روزرسانی ساخت" : "Making update"}</h2>
      <p>
        {locale === "fa"
          ? "هر یادداشت نیاز به تأیید مشتری ندارد."
          : "Not every note needs customer approval."}
      </p>
      <label htmlFor="photo">{locale === "fa" ? "گونه عکس" : "Photograph kind"}</label>
      <select id="photo" name="photo" defaultValue="forming">
        <option value="forming">{locale === "fa" ? "فرم‌دهی" : "Forming"}</option>
        <option value="cleaned">{locale === "fa" ? "فرم پاک‌شده" : "Cleaned form"}</option>
        <option value="glaze">{locale === "fa" ? "لعاب" : "Glaze"}</option>
      </select>
      <label htmlFor="note">{locale === "fa" ? "یادداشت کوتاه" : "Short note"}</label>
      <textarea id="note" name="note" className="resize-none" required />
      <button className="button" type="submit">
        {locale === "fa" ? "انتشار برای مشتری" : "Publish to the customer"}
      </button>
    </form>
  );
}

export function OpenPreKilnForm({ commission }: { commission: MakingCommission }) {
  const { artistOpenPreKiln } = useMaking();
  const { locale } = useLocale();
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        artistOpenPreKiln(commission.id, {
          dimensions: asCopy(String(data.get("dimensions") ?? "")),
          glazeCode: String(data.get("glazeCode") ?? "G-17"),
          glazeName: asCopy(String(data.get("glazeName") ?? "")),
          colorRange: asCopy(String(data.get("colorRange") ?? "")),
          testTileNote: asCopy(String(data.get("tile") ?? "")),
          createdAt: Date.now(),
        });
      }}
    >
      <h2>{locale === "fa" ? "باز کردن ایستگاه پیش از کوره" : "Open pre-kiln checkpoint"}</h2>
      <label htmlFor="dimensions">{locale === "fa" ? "ابعاد فرم" : "Form dimensions"}</label>
      <input id="dimensions" name="dimensions" required />
      <label htmlFor="glazeCode">{locale === "fa" ? "کد لعاب" : "Glaze code"}</label>
      <input id="glazeCode" name="glazeCode" defaultValue="G-17" />
      <label htmlFor="glazeName">{locale === "fa" ? "نام لعاب" : "Glaze name"}</label>
      <input id="glazeName" name="glazeName" />
      <label htmlFor="colorRange">{locale === "fa" ? "بازه رنگ مورد انتظار" : "Expected colour range"}</label>
      <textarea id="colorRange" name="colorRange" className="resize-none" />
      <label htmlFor="tile">{locale === "fa" ? "یادداشت کاشی آزمایشی" : "Test-tile note"}</label>
      <textarea id="tile" name="tile" className="resize-none" />
      <button className="button" type="submit">
        {locale === "fa" ? "درخواست تأیید مشتری" : "Request customer approval"}
      </button>
    </form>
  );
}

export function MakingPanel({ commission }: { commission: MakingCommission }) {
  if (commission.stage !== "making") return null;
  return (
    <div className="workshop-stack">
      <MakingUpdateForm commission={commission} />
      <OpenPreKilnForm commission={commission} />
    </div>
  );
}
