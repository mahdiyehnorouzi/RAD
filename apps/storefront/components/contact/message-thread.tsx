"use client";

import { useEffect, useState } from "react";
import { fetchOrderMessages, replyToContactMessage } from "@/lib/api";
import { useLocale } from "@/components/i18n";
import { helpPanelCopy } from "./const";
import type { ContactMessageThreadItem } from "@rad/types";

function formatTime(value: number, locale: "fa" | "en") {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

/**
 * Past messages for one order, each with any reply beneath it, plus a box
 * to continue the conversation. Only rendered once an order actually has a
 * message on file — most orders never do, so this stays silent otherwise.
 */
export function MessageThread({ orderId }: { orderId: string }) {
  const { locale } = useLocale();
  const c = helpPanelCopy[locale];
  const [items, setItems] = useState<ContactMessageThreadItem[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOrderMessages(orderId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!items || !items.length) return null;

  const roots = items.filter((item) => !item.parentId);
  const repliesByRoot = new Map<string, ContactMessageThreadItem[]>();
  for (const item of items) {
    if (!item.parentId) continue;
    const list = repliesByRoot.get(item.parentId) ?? [];
    list.push(item);
    repliesByRoot.set(item.parentId, list);
  }

  const sendReply = async (rootId: string) => {
    const body = (draft[rootId] ?? "").trim();
    if (!body) return;
    setSending(rootId);
    try {
      const thread = await replyToContactMessage(rootId, body);
      setItems((current) => {
        const byId = new Map((current ?? []).map((row) => [row.id, row]));
        for (const row of thread) byId.set(row.id, row);
        return [...byId.values()];
      });
      setDraft((current) => ({ ...current, [rootId]: "" }));
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="help-panel-thread">
      <h3>{c.threadTitle}</h3>
      {roots.map((root) => (
        <div className="help-panel-thread-item" key={root.id}>
          <p className="help-panel-thread-body">{root.body}</p>
          <span className="help-panel-thread-time">
            {formatTime(root.createdAt, locale)}
          </span>
          {(repliesByRoot.get(root.id) ?? []).map((reply) => (
            <div
              key={reply.id}
              className={`help-panel-thread-reply ${reply.fromAdmin ? "is-admin" : "is-you"}`}
            >
              <b>{reply.fromAdmin ? c.threadAdmin : c.threadYou}</b>
              <p>{reply.body}</p>
              <span>{formatTime(reply.createdAt, locale)}</span>
            </div>
          ))}
          <div className="help-panel-thread-compose">
            <textarea
              value={draft[root.id] ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [root.id]: event.target.value,
                }))
              }
              placeholder={c.threadReplyPlaceholder}
              rows={2}
            />
            <button
              type="button"
              onClick={() => sendReply(root.id)}
              disabled={sending === root.id || !(draft[root.id] ?? "").trim()}
            >
              {sending === root.id ? c.threadReplySending : c.threadReplySend}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
