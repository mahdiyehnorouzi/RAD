"use client";

import { useCallback } from "react";
import { logRecovered } from "@/lib/log";
import { useCommerce } from "@/components/commerce";
import type { MakingCommission } from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { MessageComposer } from "./message-composer";
import { PaymentHistory } from "./payment-history";
import { StageMessages } from "./stage-messages";
import { unreadMessageIds } from "./unread-messages";
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
  const { notices, markCommissionMessageRead } = useCommerce();
  // BUG-03: a message is marked read only once the customer actually
  // scrolls it into view (see `StageMessages`/`StageMessageItem`), never
  // just because this page was opened - that used to bulk-mark every
  // unread message in the conversation on mount/interval/visibility.
  const unread = unreadMessageIds(notices, commission.id);
  const onMessageSeen = useCallback(
    (messageId: string) => {
      void markCommissionMessageRead(commission.id, messageId).catch((error) =>
        logRecovered("notices", error),
      );
    },
    [commission.id, markCommissionMessageRead],
  );
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
            <StageMessages
              commission={commission}
              unreadMessageIds={unread}
              onMessageSeen={onMessageSeen}
            />
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
