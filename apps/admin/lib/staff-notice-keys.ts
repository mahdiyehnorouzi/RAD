import type {
  AdminCommission,
  AdminContactMessage,
  AdminOrder,
} from "./admin-data";

export function messageNoticeKey(
  root: AdminContactMessage,
  replies: AdminContactMessage[],
) {
  const latest = [root, ...replies]
    .filter((message) => !message.fromAdmin)
    .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))[0];
  return `message:${root.id}:${latest?.id ?? root.id}`;
}

export function orderNoticeKey(order: AdminOrder) {
  return `order:${order.id}:${order.status}`;
}

export function commissionNoticeKey(commission: AdminCommission) {
  return commissionMessageNoticeKey(
    commission.id,
    commission.messages
      .filter((message) => message.author === "customer" && !message.internal)
      .at(-1)?.id,
  );
}

/**
 * One customer message's own read-cursor key (BUG-03), in the same shape
 * `commissionNoticeKey` already uses for "has staff seen the latest
 * customer message" - marking a specific message read with this key, as
 * it actually scrolls into view, is what lets each message get its own
 * unread indicator instead of the whole conversation being one toggle.
 */
export function commissionMessageNoticeKey(
  commissionId: string,
  messageId: string | undefined,
) {
  return `commission:${commissionId}:${messageId ?? "created"}`;
}
