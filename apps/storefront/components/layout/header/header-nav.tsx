"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";

const links = [
  { href: "/products", key: "navProducts" as const, mobile: false },
  { href: "/studio", key: "navStudio" as const, mobile: false },
  { href: "/#story", key: "navAbout" as const, mobile: false },
  { href: "/favorites", key: "favoritesTitle" as const, mobile: true },
  { href: "/account", key: "profile" as const, mobile: true },
  { href: "/cart", key: "shoppingBag" as const, mobile: true },
  { href: "/orders", key: "orders" as const, mobile: true },
];

export function HeaderNav({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  const { t, href } = useLocale();
  return (
    <nav
      className={`header-nav ${
        open
          ? "is-open absolute inset-x-0 top-[104px] z-40 flex flex-col gap-4 border-b border-rad-line bg-rad-paper px-page py-6 lg:static lg:inset-auto lg:flex-row lg:border-0 lg:bg-transparent lg:p-0"
          : "hidden lg:flex"
      } gap-8`}
      aria-label={t("navAria")}
    >
      {links.map((link) => (
        <Link
          key={link.href + link.key}
          href={href(link.href)}
          onClick={onNavigate}
          className={`relative text-[0.86rem] after:absolute after:bottom-[-5px] after:end-0 after:h-px after:w-0 after:bg-rad-clay after:transition-[width] after:duration-200 hover:after:w-full ${
            link.mobile ? "lg:hidden" : ""
          }`}
        >
          {t(link.key)}
        </Link>
      ))}
    </nav>
  );
}
