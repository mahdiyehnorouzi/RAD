import type { MessageKey } from "@/i18n/fa";

export type AccountNavItem = {
  href: string;
  label: MessageKey;
  exact?: boolean;
};

export const ACCOUNT_NAV: AccountNavItem[] = [
  { href: "/account", label: "accountOverview", exact: true },
  { href: "/orders", label: "orders" },
  { href: "/account/making", label: "customOrdersNav" },
  { href: "/favorites", label: "favoritesNav" },
  { href: "/account/notifications", label: "notifications" },
  { href: "/account/info", label: "accountInfo" },
];

export function isAccountNavActive(pathname: string, item: AccountNavItem) {
  if (item.exact) return pathname === item.href;
  if (item.href === "/account/making") {
    return pathname === "/account/making" || pathname.startsWith("/making/");
  }
  if (item.href === "/orders") {
    return pathname === "/orders" || pathname.startsWith("/orders/");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
