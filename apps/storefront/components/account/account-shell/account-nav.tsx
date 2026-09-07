"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n";
import { ACCOUNT_NAV, isAccountNavActive } from "../const";

export function AccountNav() {
  const pathname = usePathname();
  const { t, href } = useLocale();
  return (
    <nav className="account-nav" aria-label={t("accountNavAria")}>
      {ACCOUNT_NAV.map((item) => {
        const active = isAccountNavActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={href(item.href)}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
