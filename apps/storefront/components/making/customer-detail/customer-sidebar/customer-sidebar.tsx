"use client";

import { useEffect, useRef } from "react";
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
  const attempted = useRef("");
  useEffect(() => {
    if (readOnly || !unreadKey || attempted.current === unreadKey) return;
    if (document.visibilityState !== "visible") return;
    attempted.current = unreadKey;
    void markCommissionMessagesRead(commission.id).catch(() => {
      attempted.current = "";
    });
  }, [commission.id, markCommissionMessagesRead, readOnly, unreadKey]);
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
