"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import type { Notice } from "@rad/types";
import { productCopy } from "@/lib/catalog/products";
import { useCatalog } from "@/components/catalog";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { AccountShell } from "./account-shell";
import { AccountHeading } from "./account-heading";
import { NOTICE_ICON } from "./const";
import { CardListSkeleton } from "@/components/ui/skeleton";
import "./notifications-page.css";

function noticeHref(notice: Notice) {
  if (notice.kind.startsWith("commission") && notice.productSlug) {
    return `/making/${notice.productSlug}`;
  }
  if (notice.kind.startsWith("order")) return "/orders";
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
    if (notice.kind === "order_confirmed") return t("noticeOrderConfirmed");
    if (notice.kind === "order_rejected") return t("noticeOrderRejected");
    if (notice.kind === "commission_approved") return t("noticeCommissionApproved");
    if (notice.kind === "commission_declined") return t("noticeCommissionDeclined");
    if (notice.kind === "commission_change") return t("noticeCommissionChange");
    if (notice.kind === "commission_message") return t("noticeCommissionMessage");
    if (notice.kind === "commission_quote") return t("noticeCommissionQuote");
    if (notice.kind === "commission_pre_kiln") return t("noticeCommissionPreKiln");
    if (notice.kind === "commission_firing") return t("noticeCommissionFiring");
    if (notice.kind === "commission_balance") return t("noticeCommissionBalance");
    if (notice.kind === "commission_shipped") return t("noticeCommissionShipped");
    return t("noticeWelcome");
  };

  const time = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AccountShell requireAuth>
      <section className="notifications-page section">
        <AccountHeading
          icon={Bell}
          title={t("notifications")}
          body={t("notificationsBody")}
          action={
            unread > 0 ? (
              <button className="account-button account-button--quiet" type="button" onClick={markAllRead}>
                <CheckCheck aria-hidden="true" strokeWidth={1.6} />
                {t("markAllRead")}
              </button>
            ) : null
          }
        />
        {!ready ? (
          <CardListSkeleton count={4} />
        ) : notices.length ? (
          <ul className="account-list notifications-list">
            {notices.map((notice) => {
              const target = noticeHref(notice);
              const Icon = NOTICE_ICON[notice.kind] ?? Bell;
              const body = (
                <>
                  <span className="account-badge" aria-hidden="true">
                    <Icon strokeWidth={1.6} />
                  </span>
                  <span className="notice-text">{noticeText(notice)}</span>
                  <time dateTime={new Date(notice.createdAt).toISOString()}>
                    {time.format(notice.createdAt)}
                  </time>
                </>
              );
              return (
                <li key={notice.id} className={notice.read ? undefined : "unread"}>
                  {target ? <Link href={href(target)}>{body}</Link> : <div>{body}</div>}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="account-empty">
            <p>{t("noNotifications")}</p>
          </div>
        )}
      </section>
    </AccountShell>
  );
}
