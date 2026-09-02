"use client";

import { Heart, Menu as MenuIcon, ShoppingBag, X } from "lucide-react";
import { SiteSearch } from "./site-search";
import { useCart } from "@/components/cart/cart-provider";
import { useLocale } from "@/components/i18n";
import { openHeaderOverlay } from "@/hooks/use-header-overlay";
import {
  CountBadge,
  UtilityButton,
  UtilityLink,
} from "@/components/ui/utility-button";

export function HeaderActions({
  menuOpen,
  onToggleMenu,
}: {
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const { count } = useCart();
  const { locale, setLocale, t, href, number } = useLocale();

  return (
    <div className="flex items-center gap-3.5">
      <button
        className="order-first h-11 min-w-[72px] border-0 border-b border-rad-line bg-transparent text-caption font-medium tracking-wider text-rad-moss hover:border-rad-clay hover:text-rad-clay"
        onClick={() => {
          openHeaderOverlay("language");
          setLocale(locale === "fa" ? "en" : "fa");
        }}
        aria-label={locale === "fa" ? t("switchToEnAria") : t("switchToFaAria")}
      >
        {locale === "fa" ? t("switchToEn") : t("switchToFa")}
      </button>
      <SiteSearch />
      <UtilityLink href={href("/favorites")} label={t("favoritesTitle")}>
        <Heart aria-hidden="true" />
      </UtilityLink>
      <UtilityLink href={href("/cart")} label={t("bagAria")}>
        <ShoppingBag aria-hidden="true" />
        <CountBadge>{number(count)}</CountBadge>
      </UtilityLink>
      <UtilityButton
        className="md:hidden"
        label={menuOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
      >
        {menuOpen ? <X aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
      </UtilityButton>
    </div>
  );
}
