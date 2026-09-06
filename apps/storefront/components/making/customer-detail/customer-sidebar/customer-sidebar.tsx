"use client";

import type {MakingCommission} from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { MessageComposer } from "./message-composer";
import { PaymentHistory } from "./payment-history";
import { StageMessages } from "./stage-messages";
import "./customer-sidebar.css";

export function CustomerMakingSidebar({ commission }: { commission: MakingCommission }) {
  const { addMessage } = useMaking();
  const { locale } = useLocale();
  const showMessages = commission.stage !== "complete" && commission.stage !== "shipping";
  const canCompose = commission.stage !== "complete" && commission.stage !== "declined";

  return (
    <aside className="making-side">
      <section className="making-side-block">
        <h2>{locale === "fa" ? "پرداخت‌ها" : "Payments"}</h2>
        <PaymentHistory commission={commission} />
      </section>
      <section className="making-side-block">
        <h2>{locale === "fa" ? "پیام‌های مرحله" : "Stage messages"}</h2>
        {showMessages ? <StageMessages commission={commission} /> : null}
        {canCompose ? (
          <MessageComposer
            onSend={(body) => addMessage(commission.id, { author: "customer", body })}
          />
        ) : null}
      </section>
    </aside>
  );
}
