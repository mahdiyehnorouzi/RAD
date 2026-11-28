"use client";

import "./customer-sidebar.css";
import { useEffect, useRef } from "react";
import type { MakingCommission, StageMessage } from "@/components/making/type";
import { copy, STAGE_LABEL } from "@/lib/making";
import { formatWhen } from "@/lib/making";
import { useLocale } from "@/components/i18n";

/**
 * One message bubble. Unread (BUG-03) is tracked separately from
 * rendering: a message is only marked read once it actually scrolls into
 * view while the tab is visible, never just because the conversation was
 * opened - `onSeen` is called at most once per mount per message id.
 */
function StageMessageItem({
  item,
  author,
  unread,
  onSeen,
}: {
  item: StageMessage;
  author: string;
  unread: boolean;
  onSeen?: () => void;
}) {
  const { locale } = useLocale();
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !unread || !onSeen) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (
        document.visibilityState === "visible" &&
        entries.some((entry) => entry.isIntersecting)
      ) {
        onSeen();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [unread, onSeen]);

  return (
    <li
      ref={ref}
      className={`${item.internal ? "internal" : item.author}${unread ? " unread" : ""}`}
    >
      <header>
        <b>{author}</b>
        {unread ? (
          <span className="sr-only">
            {locale === "fa" ? "پیام خوانده‌نشده" : "Unread message"}
          </span>
        ) : null}
        <span>{copy(STAGE_LABEL[item.stageId], locale)}</span>
        <time>{formatWhen(item.createdAt, locale)}</time>
      </header>
      <p>{copy(item.body, locale)}</p>
    </li>
  );
}

export function StageMessages({
  commission,
  revealInternal = false,
  internalOnly = false,
  unreadMessageIds,
  onMessageSeen,
}: {
  commission: MakingCommission;
  revealInternal?: boolean;
  internalOnly?: boolean;
  /** Ids of this commission's messages that are still unread for the viewer (BUG-03). */
  unreadMessageIds?: Set<string>;
  onMessageSeen?: (messageId: string) => void;
}) {
  const { locale } = useLocale();
  const items = (
    internalOnly
      ? commission.internalNotes
      : [
          ...commission.messages,
          ...(revealInternal ? commission.internalNotes : []),
        ]
  ).sort((a, b) => a.createdAt - b.createdAt);
  if (!items.length) return null;
  return (
    <ol className="making-messages">
      {items.map((item) => (
        <StageMessageItem
          key={item.id}
          item={item}
          unread={Boolean(unreadMessageIds?.has(item.id))}
          onSeen={onMessageSeen ? () => onMessageSeen(item.id) : undefined}
          author={
            item.internal
              ? locale === "fa"
                ? "یادداشت داخلی"
                : "Internal note"
              : item.author === "artist"
                ? locale === "fa"
                  ? "کارگاه"
                  : "Workshop"
                : item.author === "system"
                  ? locale === "fa"
                    ? "سامانه"
                    : "System"
                  : commission.customerName
          }
        />
      ))}
    </ol>
  );
}
