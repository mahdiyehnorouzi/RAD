"use client";

import Link from "next/link";
import type { Notice } from "@rad/types";
import { productCopy } from "@/lib/catalog/products";
import { useCatalog } from "@/components/catalog";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { AccountShell } from "./account-shell";
import { CardListSkeleton } from "@/components/ui/skeleton";
import "./notifications-page.css";

function noticeHref(notice: Notice) {
  if (notice.kind.startsWith("commission") && notice.productSlug) {
    return `/making/${notice.productSlug}`;
  }
  if (notice.kind === "order") return "/orders";
  return null;
}

export function NotificationsPage() {
  const { notices, unread, markAllRead, ready } = useCommerce();
  const { locale, t, href } = useLocale();
  const { getProduct } = useCatalog();

  const noticeText = (notice: Notice) => {
    const product = getProduct(notice.productSlug ?? "");
    const name = product ? productCopy(product, locale).name : "";
    if (notice.kind === "favorite") return `${t("noticeFavorite")} ${name}`;
    if (notice.kind === "cart") return `${t("noticeCart")} ${name}`;
    if (notice.kind === "order") return t("noticeOrder");
    if (notice.kind === "commission_approved") return t("noticeCommissionApproved");
    if (notice.kind === "commission_declined") return t("noticeCommissionDeclined");
    if (notice.kind === "commission_change") return t("noticeCommissionChange");
    if (notice.kind === "commission_message") return t("noticeCommissionMessage");
    return t("noticeWelcome");
  };

  return (
    <AccountShell requireAuth>
      <section className="notifications-page section">
        <header className="notifications-heading">
          <div>
            <span className="eyebrow">{t("notificationCenter")}</span>
            <h1>{t("notifications")}</h1>
          </div>
          {unread > 0 && (
            <button className="text-button" type="button" onClick={markAllRead}>
              {t("markAllRead")}
            </button>
          )}
        </header>
        {!ready ? (
          <CardListSkeleton count={4} />
        ) : notices.length ? (
          <ul className="notifications-list">
            {notices.map((notice) => {
              const target = noticeHref(notice);
              return (
                <li key={notice.id} className={notice.read ? "" : "unread"}>
                  {target ? (
                    <Link href={href(target)}>{noticeText(notice)}</Link>
                  ) : (
                    <span>{noticeText(notice)}</span>
                  )}
                  <small>
                    {new Intl.DateTimeFormat(
                      locale === "fa" ? "fa-IR" : "en-US",
                      { hour: "2-digit", minute: "2-digit" },
                    ).format(notice.createdAt)}
                  </small>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{t("noNotifications")}</p>
        )}
      </section>
    </AccountShell>
  );
}
