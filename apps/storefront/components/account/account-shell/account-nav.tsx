"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { usePublicPathname } from "@/hooks/use-public-pathname";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ACCOUNT_NAV, isAccountNavActive } from "../const";
import { profileSectionFromPath } from "../profile-section";
import { useProfileTabs } from "../profile-tabs";

export function AccountNav() {
  const pathname = usePublicPathname();
  const { t, href, number } = useLocale();
  const { unread } = useCommerce();
  const tabs = useProfileTabs();
  const activeRef = useRef<HTMLElement>(null);
  const setActive = (node: HTMLElement | null) => {
    activeRef.current = node;
  };

  useEffect(() => {
    const link = activeRef.current;
    const strip = link?.parentElement;
    if (!link || !strip || strip.scrollWidth <= strip.clientWidth) return;
    link.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname, tabs?.section]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!tabs) return;
    const keys = [
      "ArrowRight",
      "ArrowLeft",
      "ArrowDown",
      "ArrowUp",
      "Home",
      "End",
    ];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const order = ACCOUNT_NAV.map((item) => profileSectionFromPath(item.href));
    const index = order.indexOf(tabs.section);
    const rtl = document.documentElement.dir === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    let next = index;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = order.length - 1;
    else if (event.key === forward || event.key === "ArrowDown") {
      next = (index + 1) % order.length;
    } else if (event.key === backward || event.key === "ArrowUp") {
      next = (index - 1 + order.length) % order.length;
    }
    const section = order[next];
    if (section) tabs.select(section);
  };

  return (
    <nav
      className="account-nav"
      aria-label={t("accountNavAria")}
      role={tabs ? "tablist" : undefined}
      onKeyDown={onKeyDown}
    >
      {ACCOUNT_NAV.map((item) => {
        const section = profileSectionFromPath(item.href);
        const active = tabs
          ? tabs.section === section
          : isAccountNavActive(pathname, item);
        const Icon = item.icon;
        const count = item.href === "/account/notifications" ? unread : 0;
        const body = (
          <>
            <Icon
              className="account-nav-icon"
              aria-hidden="true"
              strokeWidth={1.6}
            />
            <span className="account-nav-text">
              <b>{t(item.label)}</b>
              <small>{t(item.hint)}</small>
            </span>
            {count > 0 ? (
              <span
                className="account-nav-count"
                aria-label={t("unreadCount", { count: number(count) })}
              >
                {number(count)}
              </span>
            ) : null}
          </>
        );
        if (tabs) {
          return (
            <button
              key={item.href}
              id={`profile-tab-${section}`}
              ref={active ? setActive : undefined}
              type="button"
              role="tab"
              className={active ? "active" : undefined}
              aria-selected={active}
              aria-controls="profile-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => tabs.select(section)}
            >
              {body}
            </button>
          );
        }
        return (
          <Link
            key={item.href}
            ref={active ? setActive : undefined}
            href={href(item.href)}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {body}
          </Link>
        );
      })}
    </nav>
  );
}
