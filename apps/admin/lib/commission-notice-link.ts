import type { AdminCommission } from "./admin-data";

const PREFIX = "#commissions/";

export type CommissionHashFocus = {
  id: string;
  tab: "messages" | null;
  messageId: string | null;
};

export type CommissionDetailTab =
  "summary" | "files" | "messages" | "history" | "decision";

/** Last public message, if the customer wrote it. Order notices have none. */
export function latestCustomerMessage(commission: {
  messages: AdminCommission["messages"];
}) {
  const last = commission.messages
    .filter((message) => !message.internal)
    .at(-1);
  return last?.author === "customer" ? last : null;
}

export function commissionNoticeHash(commission: {
  id: string;
  messages: AdminCommission["messages"];
}) {
  const message = latestCustomerMessage(commission);
  const id = encodeURIComponent(commission.id);
  if (!message) return `${PREFIX}${id}`;
  return `${PREFIX}${id}/messages/${encodeURIComponent(message.id)}`;
}

export function parseCommissionHash(hash: string): CommissionHashFocus | null {
  if (!hash.startsWith(PREFIX)) return null;
  const parts = hash.slice(PREFIX.length).split("/");
  const id = decodeURIComponent(parts[0] ?? "");
  if (!id) return null;
  if (parts[1] !== "messages") return { id, tab: null, messageId: null };
  const raw = parts.slice(2).join("/");
  return {
    id,
    tab: "messages",
    messageId: raw ? decodeURIComponent(raw) : null,
  };
}

/**
 * A message notice stays unread until the messages tab has actually drawn
 * the target message. An order notice stays unread on the messages tab.
 */
export function commissionNoticeShouldMarkRead(input: {
  noticeKey: string;
  tab: CommissionDetailTab;
  messageId: string | null;
  messageRendered: boolean;
}) {
  const messageNotice = !input.noticeKey.endsWith(":created");
  if (messageNotice) {
    if (input.tab !== "messages") return false;
    if (input.messageId) return input.messageRendered;
    return true;
  }
  return input.tab === "summary" || input.tab === "decision";
}
