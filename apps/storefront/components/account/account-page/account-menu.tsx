"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ACCOUNT_NAV } from "../const";

/** On phones the profile opens on this list of tabs instead of the pill strip. */
export function AccountMenu() {
  const { locale, t, href, number } = useLocale();
  const { unread } = useCommerce();
  const Chevron = locale === "fa" ? ChevronLeft : ChevronRight;

  return (
    <nav className="account-menu" aria-label={t("accountNavAria")}>
      <ul>
        {ACCOUNT_NAV.filter((item) => !item.exact).map((item) => {
          const Icon = item.icon;
          const count = item.href === "/account/notifications" ? unread : 0;
          return (
            <li key={item.href}>
              <Link href={href(item.href)}>
                <span className="account-badge" aria-hidden="true">
                  <Icon strokeWidth={1.6} />
                </span>
                <span className="account-menu-text">
                  <b>{t(item.label)}</b>
                  <small>{t(item.hint)}</small>
                </span>
                {count > 0 ? (
                  <span className="account-menu-count" aria-label={t("unreadCount", { count: number(count) })}>
                    {number(count)}
                  </span>
                ) : null}
                <Chevron className="account-menu-chevron" aria-hidden="true" strokeWidth={1.6} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
