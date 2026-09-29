"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ACCOUNT_NAV, isAccountNavActive } from "../const";

export function AccountNav() {
  const pathname = usePathname();
  const { t, href, number } = useLocale();
  const { unread } = useCommerce();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = activeRef.current;
    const strip = link?.parentElement;
    if (!link || !strip || strip.scrollWidth <= strip.clientWidth) return;
    link.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav className="account-nav" aria-label={t("accountNavAria")}>
      {ACCOUNT_NAV.map((item) => {
        const active = isAccountNavActive(pathname, item);
        const Icon = item.icon;
        const count = item.href === "/account/notifications" ? unread : 0;
        return (
          <Link
            key={item.href}
            ref={active ? activeRef : undefined}
            href={href(item.href)}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="account-nav-icon" aria-hidden="true" strokeWidth={1.6} />
            <span className="account-nav-text">
              <b>{t(item.label)}</b>
              <small>{t(item.hint)}</small>
            </span>
            {count > 0 ? (
              <span className="account-nav-count" aria-label={t("unreadCount", { count: number(count) })}>
                {number(count)}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
