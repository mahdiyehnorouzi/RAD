"use client";

import type { MakingCommission } from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";

export function ShipPanel({ commission }: { commission: MakingCommission }) {
  const { artistShip } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "shipping") return null;
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        artistShip(commission.id, String(data.get("tracking") ?? "").trim());
      }}
    >
      <h2>{locale === "fa" ? "ارسال" : "Shipping"}</h2>
      <label htmlFor="tracking">{locale === "fa" ? "شماره رهگیری" : "Tracking number"}</label>
      <input id="tracking" name="tracking" required />
      <button className="button" type="submit">
        {locale === "fa" ? "ثبت ارسال و بستن رکورد" : "Mark shipped and close the record"}
      </button>
    </form>
  );
}
