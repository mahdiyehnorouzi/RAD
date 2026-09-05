"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart";
import { useLocale } from "@/components/i18n";
import { SiteSearch } from "./site-search";
import { Heart, Menu as MenuIcon, ShoppingBag, X } from "lucide-react";
import "./header.css";

export function Header() {
  const [open, setOpen] = useState(false);
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
    <header className="header">
      <Link
        href={href("/")}
        className="logo"
        aria-label={t("home")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span className="logo-mark" aria-hidden="true">
          <Image src="/rad-logo.png" alt="" width={1254} height={1254} priority />
        </span>
        <span>{t("logoSubtitle")}</span>
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
        <Link href={href("/#story")} onClick={() => setOpen(false)}>
          {t("navAbout")}
        </Link>
        <Link className="mobile-nav-link" href={href("/favorites")} onClick={() => setOpen(false)}>
          {t("favoritesTitle")}
        </Link>
        <Link className="mobile-nav-link" href={href("/account")} onClick={() => setOpen(false)}>
          {t("profile")}
        </Link>
        <Link className="mobile-nav-link" href={href("/cart")} onClick={() => setOpen(false)}>
          {t("shoppingBag")}
        </Link>
        <Link className="mobile-nav-link" href={href("/orders")} onClick={() => setOpen(false)}>
          {t("orders")}
        </Link>
      </nav>
      <div className="header-actions">
        <SiteSearch />
        <Link href={href("/favorites")} className="utility-button header-favorites" aria-label={t("favoritesTitle")}>
          <Heart aria-hidden="true" />
        </Link>
        <Link href={href("/cart")} className="utility-button cart-button" aria-label={t("bagAria")}>
          <ShoppingBag aria-hidden="true" />
          <i>{number(count)}</i>
        </Link>
        <button
          className="language-switch"
          onClick={() => {
            queueMicrotask(() =>
              window.dispatchEvent(new CustomEvent("rad:header-overlay", { detail: "language" })),
            );
            setLocale(locale === "fa" ? "en" : "fa");
          }}
          aria-label={locale === "fa" ? "Switch to English" : "تغییر زبان به فارسی"}
        >
          {locale === "fa" ? "انگلیسی" : "فارسی"}
        </button>
        <button
          className="menu"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              queueMicrotask(() =>
                window.dispatchEvent(new CustomEvent("rad:header-overlay", { detail: "menu" })),
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
