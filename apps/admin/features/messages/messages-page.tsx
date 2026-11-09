"use client";

import { useAdminChrome } from "../../components/admin-shell";
import { AdminMessages } from "./admin-messages";

export function MessagesPage() {
  const { workspace, announce, openOrder } = useAdminChrome();
  const loading =
    !workspace.loadedKeys.has("messages") &&
    !workspace.loadErrors.has("messages");
  return (
    <AdminMessages
      messages={workspace.messages}
      loading={loading}
      loadError={workspace.loadErrors.has("messages")}
      refreshing={workspace.refreshingKeys.has("messages")}
      refreshError={workspace.refreshErrors.has("messages")}
      onRetry={() => {
        void workspace.retryResource("messages");
      }}
      orders={workspace.orders}
      canWrite={workspace.can("order.write")}
      onSetStatus={async (id, status) => {
        await workspace.setMessageStatus(id, status);
        announce(
          status === "resolved"
            ? "پیام رسیدگی‌شده ثبت شد."
            : "پیام دوباره باز شد.",
        );
      }}
      onReply={async (id, body) => {
        await workspace.replyToMessage(id, body);
        announce("پاسخ برای مشتری ارسال شد.");
      }}
      onOpenOrder={openOrder}
    />
  );
}
