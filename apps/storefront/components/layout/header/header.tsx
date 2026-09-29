"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart";
import { useLocale } from "@/components/i18n";
import { useHeaderMotion } from "./hooks";
import { Heart, Menu as MenuIcon, ShoppingBag, X } from "lucide-react";
import "./header.css";

export function Header() {
  const [open, setOpen] = useState(false);
  const { compact } = useHeaderMotion(open);
  const pathname = usePathname();
  const { count } = useCart();
  const { locale, setLocale, t, href, number } = useLocale();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const close = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== "menu") setOpen(false);
    };
    window.addEventListener("rad:header-overlay", close);
    return () => window.removeEventListener("rad:header-overlay", close);
  }, []);

  return (
    <header className={`header${compact ? " is-compact" : ""}`}>
      <Link
        href={href("/")}
        className="logo"
        aria-label={t("home")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <Image src="/rad-mark.png" alt="" width={224} height={224} priority />
      </Link>
      <nav className={open ? "nav open" : "nav"} aria-label={t("navAria")}>
        <Link href={href("/products")} onClick={() => setOpen(false)}>
          {t("navProducts")}
        </Link>
        <Link href={href("/studio")} onClick={() => setOpen(false)}>
          {t("navStudio")}
        </Link>
        <Link href={href("/making")} onClick={() => setOpen(false)}>
          {t("makingNav")}
        </Link>
        <Link href={href("/about")} onClick={() => setOpen(false)}>
          {t("navAbout")}
        </Link>
        <Link
          className="mobile-nav-link"
          href={href("/favorites")}
          onClick={() => setOpen(false)}
        >
          {t("favoritesTitle")}
        </Link>
        <Link
          className="mobile-nav-link"
          href={href("/account")}
          onClick={() => setOpen(false)}
        >
          {t("profile")}
        </Link>
        <Link
          className="mobile-nav-link"
          href={href("/cart")}
          onClick={() => setOpen(false)}
        >
          {t("shoppingBag")}
        </Link>
      </nav>
      <div className="header-actions">
        <button
          type="button"
          className="language-switch"
          dir="ltr"
          onClick={() => {
            queueMicrotask(() =>
              window.dispatchEvent(
                new CustomEvent("rad:header-overlay", { detail: "language" }),
              ),
            );
            setLocale(locale === "fa" ? "en" : "fa");
          }}
          aria-label={
            locale === "fa" ? "Switch to English" : "تغییر زبان به فارسی"
          }
        >
          <span data-active={locale === "fa"}>FA</span>
          <span data-active={locale === "en"}>EN</span>
        </button>
        <Link
          href={href("/favorites")}
          className="utility-button header-favorites"
          aria-label={t("favoritesTitle")}
        >
          <Heart aria-hidden="true" />
        </Link>
        <Link
          href={href("/cart")}
          className="utility-button cart-button"
          aria-label={t("bagAria")}
        >
          <ShoppingBag aria-hidden="true" />
          <i>{number(count)}</i>
        </Link>
        <button
          type="button"
          className="menu"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              queueMicrotask(() =>
                window.dispatchEvent(
                  new CustomEvent("rad:header-overlay", { detail: "menu" }),
                ),
              );
            }
          }}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
        >
          {open ? <X aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
