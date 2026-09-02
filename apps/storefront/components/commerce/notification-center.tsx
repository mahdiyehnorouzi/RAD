"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import type { Notice } from "@rad/types";
import { productCopy } from "@/lib/products";
import { useCatalog } from "@/components/catalog-provider";
import { useCommerce } from "./commerce-provider";
import { useLocale } from "@/components/i18n";
import {
  openHeaderOverlay,
  useEscape,
  useHeaderOverlay,
} from "@/hooks/use-header-overlay";
import { CountBadge, UtilityButton } from "@/components/ui/utility-button";
import { Eyebrow } from "@/components/ui/section";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { notices, unread, markAllRead } = useCommerce();
  const { locale, t, number } = useLocale();
  const { getProduct } = useCatalog();
  const close = useCallback(() => setOpen(false), []);
  useHeaderOverlay("notifications", close);
  useEscape(close);
  useEffect(() => close(), [pathname, close]);

  const noticeText = (notice: Notice) => {
    const product = getProduct(notice.productSlug ?? "");
    const name = product ? productCopy(product, locale).name : "";
    if (notice.kind === "favorite") return `${t("noticeFavorite")} ${name}`;
    if (notice.kind === "cart") return `${t("noticeCart")} ${name}`;
    if (notice.kind === "order") return t("noticeOrder");
    return t("noticeWelcome");
  };

  return (
    <div className="relative">
      <UtilityButton
        label={t("notifications")}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() =>
          setOpen((value) => {
            const next = !value;
            if (next) openHeaderOverlay("notifications");
            return next;
          })
        }
      >
        <Bell aria-hidden="true" />
        {unread > 0 && <CountBadge>{number(unread)}</CountBadge>}
      </UtilityButton>
      {open && (
        <aside
          id="notification-panel"
          className="absolute end-0 top-[calc(100%+1rem)] z-50 w-[min(360px,calc(100vw-2*theme(spacing.page)))] border border-rad-line bg-rad-paper p-4"
        >
          <header className="mb-3 flex items-start justify-between gap-3">
            <div>
              <Eyebrow className="mb-1">{t("notificationCenter")}</Eyebrow>
              <h2 className="m-0 text-lg font-normal">{t("notifications")}</h2>
            </div>
            {unread > 0 && (
              <button
                className="border-0 border-b border-current bg-transparent text-sm"
                onClick={markAllRead}
              >
                {t("markAllRead")}
              </button>
            )}
          </header>
          {notices.length ? (
            <ul className="m-0 max-h-[50vh] list-none overflow-auto p-0">
              {notices.map((notice) => (
                <li
                  key={notice.id}
                  className={`border-t border-rad-line py-3 ${notice.read ? "" : "font-medium"}`}
                >
                  <span>{noticeText(notice)}</span>
                  <small className="mt-1 block text-rad-muted">
                    {new Intl.DateTimeFormat(
                      locale === "fa" ? "fa-IR" : "en-US",
                      { hour: "2-digit", minute: "2-digit" },
                    ).format(notice.createdAt)}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-rad-muted">{t("noNotifications")}</p>
          )}
        </aside>
      )}
    </div>
  );
}
