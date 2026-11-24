"use client";

import { useEffect } from "react";
import { logRecovered } from "@/lib/log";
import { useCommerce } from "@/components/commerce";
import type { MakingCommission } from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { MessageComposer } from "./message-composer";
import { PaymentHistory } from "./payment-history";
import { StageMessages } from "./stage-messages";
import "./customer-sidebar.css";

export function CustomerMakingSidebar({
  commission,
  readOnly = false,
}: {
  commission: MakingCommission;
  readOnly?: boolean;
}) {
  const { addMessage } = useMaking();
  const { locale } = useLocale();
  const { notices, markCommissionMessagesRead } = useCommerce();
  const unread = notices.filter(
    (notice) =>
      !notice.read &&
      notice.kind === "commission_message" &&
      notice.productSlug === commission.id,
  );
  const unreadKey = unread.map((notice) => notice.id).join(",");
  useEffect(() => {
    if (!unreadKey) return;
    let running = false;
    const markRead = () => {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      void markCommissionMessagesRead(commission.id)
        .catch((error) => logRecovered("notices", error))
        .finally(() => {
          running = false;
        });
    };
    markRead();
    const timer = window.setInterval(markRead, 12_000);
    document.addEventListener("visibilitychange", markRead);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", markRead);
    };
  }, [commission.id, markCommissionMessagesRead, unreadKey]);
  const showMessages = true;
  const canCompose =
    !readOnly &&
    commission.stage !== "complete" &&
    commission.stage !== "declined";
  const hasMessages = commission.messages.length > 0;

  return (
    <aside className="making-side">
      {commission.payments.length ? (
        <section className="making-side-block">
          <h2>{locale === "fa" ? "پرداخت‌ها" : "Payments"}</h2>
          <PaymentHistory commission={commission} />
        </section>
      ) : null}
      {(showMessages && hasMessages) || canCompose ? (
        <section className="making-side-block">
          <h2>{locale === "fa" ? "گفتگو با سازنده" : "Talk with the maker"}</h2>
          {showMessages && hasMessages ? (
            <StageMessages commission={commission} />
          ) : null}
          {canCompose ? (
            <MessageComposer
              key={commission.id}
              onSend={(body, operationId) =>
                addMessage(commission.id, {
                  author: "customer",
                  body,
                  operationId,
                })
              }
            />
          ) : null}
        </section>
      ) : null}
    </aside>
  );
}
