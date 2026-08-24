"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { productCopy } from "@/lib/products";
import { productPrice, useCart } from "./cart";
import { useLocale } from "./i18n";
import { SiteSearch } from "./search";
import {
  AccountLink,
  FavoriteButton,
  NotificationCenter,
  useCommerce,
} from "./commerce";
import {
  Heart,
  ImageOff,
  Menu as MenuIcon,
  Minus,
  PackageSearch,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";

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
        <b>رَد</b>
        <span>{t("logoSubtitle")}</span>
      </Link>
      <nav className={open ? "nav open" : "nav"} aria-label={t("navAria")}>
        <Link href={href("/products")} onClick={() => setOpen(false)}>
          {t("navProducts")}
        </Link>
        <Link href={href("/studio")} onClick={() => setOpen(false)}>
          {t("navStudio")}
        </Link>
        <Link href={href("/#story")} onClick={() => setOpen(false)}>
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
        <Link
          className="mobile-nav-link"
          href={href("/orders")}
          onClick={() => setOpen(false)}
        >
          {t("orders")}
        </Link>
      </nav>
      <div className="header-actions">
        <SiteSearch />
        <Link
          href={href("/favorites")}
          className="utility-button header-favorites"
          aria-label={t("favoritesTitle")}
        >
          <Heart aria-hidden="true" />
        </Link>
        <NotificationCenter />
        <Link
          href={href("/orders")}
          className="utility-button orders-link"
          aria-label={t("orders")}
        >
          <PackageSearch aria-hidden="true" />
        </Link>
        <Link
          href={href("/cart")}
          className="utility-button cart-button"
          aria-label={t("bagAria")}
        >
          <ShoppingBag aria-hidden="true" />
          <i>{number(count)}</i>
        </Link>
        <AccountLink />
        <button
          className="language-switch"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("rad:header-overlay", { detail: "language" }),
            );
            setLocale(locale === "fa" ? "en" : "fa");
          }}
          aria-label={
            locale === "fa" ? "Switch to English" : "تغییر زبان به فارسی"
          }
        >
          {locale === "fa" ? "انگلیسی" : "فارسی"}
        </button>
        <button
          className="menu"
          onClick={() =>
            setOpen((current) => {
              const next = !current;
              if (next)
                window.dispatchEvent(
                  new CustomEvent("rad:header-overlay", { detail: "menu" }),
                );
              return next;
            })
          }
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
        >
          {open ? <X aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
export function Footer() {
  const { t, href, locale } = useLocale();
  return (
    <footer className="footer">
      <div>
        <Link href={href("/")} className="footer-logo">
          رَد
        </Link>
        <p>{t("footerTagline")}</p>
      </div>
      <div className="footer-links">
        <section>
          <b>{t("footerStudio")}</b>
          <Link href={href("/products")}>{t("footerUnique")}</Link>
          <Link href={href("/studio")}>{t("footerCustom")}</Link>
        </section>
        <section>
          <b>{t("footerRad")}</b>
          <Link href={href("/#story")}>{t("footerStory")}</Link>
          <Link href={href("/#journal")}>{t("navJournal")}</Link>
        </section>
      </div>
      <small>{t("footerCopyright")}</small>
      <div className="footer-signature" aria-hidden="true">
        <span>1 / 1</span>
        <span>{locale === "fa" ? "تهران — ۱۴۰۵" : "TEHRAN — 2026"}</span>
      </div>
    </footer>
  );
}
export function Vessel({
  product,
  className = "",
}: {
  product: Pick<Product, "color" | "accent" | "shape">;
  className?: string;
}) {
  return (
    <div
      className={`vessel ${product.shape} ${className}`}
      style={
        {
          "--vessel": product.color,
          "--accent": product.accent,
        } as React.CSSProperties
      }
    >
      <span className="vessel-neck" />
      <span className="vessel-line" />
    </div>
  );
}
export function ProductMedia({
  product,
  imageIndex = 0,
}: {
  product: Product;
  imageIndex?: number;
}) {
  const { locale, t } = useLocale();
  if (product.images && product.images.length === 0)
    return (
      <div className="product-fallback">
        <ImageOff aria-hidden="true" />
        <span>{t("imageUnavailable")}</span>
      </div>
    );
  const media = product.images?.[imageIndex] ?? product.images?.[0];
  if (media?.src)
    return (
      <img
        className="product-photo"
        src={media.src}
        alt={locale === "fa" ? media.alt : media.enAlt}
      />
    );
  return (
    <Vessel
      product={{
        color: media?.color ?? product.color,
        accent: media?.accent ?? product.accent,
        shape: media?.shape ?? product.shape,
      }}
    />
  );
}
export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const { locale, t, href, number } = useLocale();
  const { add, remove, has } = useCart();
  const { addNotice } = useCommerce();
  const copy = productCopy(product, locale);
  const inBag = has(product.slug);
  const category =
    product.category === "vases"
      ? t("filterVases")
      : product.category === "tableware"
        ? t("filterTableware")
        : t("filterSculpture");
  return (
    <article className="product-card">
      <div className="product-media-shell">
        <FavoriteButton slug={product.slug} compact />
        <button
          className={inBag ? "quick-add added" : "quick-add"}
          type="button"
          onClick={() => {
            if (inBag) remove(product.slug);
            else {
              add(product);
              addNotice("cart", product.slug);
            }
          }}
          aria-label={`${inBag ? t("removeBag") : t("quickAdd")} ${copy.name}`}
        >
          {inBag ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}
          <span>{inBag ? t("removeBag") : t("quickAdd")}</span>
        </button>
        <Link
          href={href(`/products/${product.slug}`)}
          className="product-art"
          aria-label={`${t("viewProduct")} ${copy.name}`}
        >
          <span className="edition">{locale === "fa" ? "۱/۱" : "1/1"}</span>
          <small className="product-index">
            {number(index + 1).padStart(2, locale === "fa" ? "۰" : "0")}
          </small>
          <ProductMedia product={product} />
        </Link>
      </div>
      <div className="product-meta">
        <div>
          <small className="product-category">{category}</small>
          <h3>
            <Link href={href(`/products/${product.slug}`)}>{copy.name}</Link>
          </h3>
          <p>{copy.subtitle}</p>
        </div>
        <span>{productPrice(product, locale)}</span>
      </div>
    </article>
  );
}
export function ButtonLink({
  href,
  children,
  light = false,
  outline = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
  outline?: boolean;
}) {
  const { href: localizedHref } = useLocale();
  return (
    <Link
      className={`button ${light ? "light" : ""} ${outline ? "outline" : ""}`}
      href={localizedHref(href)}
    >
      {children}
    </Link>
  );
}
