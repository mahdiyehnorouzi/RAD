import {
  Bell,
  Heart,
  PenLine,
  ShoppingBag,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/i18n/fa";

type AccountNavItem = {
  href: string;
  label: MessageKey;
  hint: MessageKey;
  icon: LucideIcon;
  exact?: boolean;
};

export const ACCOUNT_HUB = "/account";

export const ACCOUNT_NAV: AccountNavItem[] = [
  {
    href: ACCOUNT_HUB,
    label: "myCollectionTitle",
    hint: "navHintCollection",
    icon: ShoppingBag,
    exact: true,
  },
  { href: "/orders", label: "orders", hint: "navHintOrders", icon: Truck },
  {
    href: "/account/making",
    label: "customOrdersNav",
    hint: "navHintCustom",
    icon: PenLine,
  },
  {
    href: "/favorites",
    label: "favoritesNav",
    hint: "navHintFavorites",
    icon: Heart,
  },
  {
    href: "/account/notifications",
    label: "notifications",
    hint: "navHintNotifications",
    icon: Bell,
  },
  {
    href: "/account/info",
    label: "accountInfo",
    hint: "navHintAccount",
    icon: UserRound,
  },
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
