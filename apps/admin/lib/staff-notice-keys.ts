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
  const latest = commission.messages
    .filter((message) => message.author === "customer" && !message.internal)
    .at(-1);
  return `commission:${commission.id}:${latest?.id ?? "created"}`;
}
