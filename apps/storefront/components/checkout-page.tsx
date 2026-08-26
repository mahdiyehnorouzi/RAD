"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart, cartTotal, formatTotal } from "./cart";
import { useCommerce } from "./commerce";
import { useLocale } from "./i18n";
import { products } from "@/lib/products";

export function CheckoutPage() {
  const { slugs, clear } = useCart();
  const { user, addNotice, placeOrder } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const router = useRouter();

  const items = slugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((item): item is (typeof products)[number] => Boolean(item));
  const total = cartTotal(items, locale);
  const totalToman = cartTotal(items, "fa");
  const totalUsd = cartTotal(items, "en");

  const submitDemoOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();

    placeOrder({
      slugs: [...slugs],
      total: totalToman,
      usdTotal: totalUsd,
      delivery: {
        name: name || user?.name || (locale === "fa" ? "کاربر رَد" : "RAD collector"),
        city: city || (locale === "fa" ? "تهران" : "Tehran"),
      },
    });
    addNotice("order");
    clear();
    router.push(href("/orders"));
  };

  if (!items.length) {
    return (
      <section className="cart-empty section">
        <h1>{t("emptyBag")}</h1>
        <Link className="button" href={href("/products")}>
          {t("viewWorks")}
        </Link>
      </section>
    );
  }

  return (
    <section className="checkout-page section">
      <header>
        <span className="eyebrow">{t("checkoutEyebrow")}</span>
        <h1>{t("checkoutTitle")}</h1>
        <p>{t("checkoutBody")}</p>
      </header>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={submitDemoOrder} noValidate>
          <label htmlFor="checkout-name">{t("nameLabel")}</label>
          <input id="checkout-name" name="name" defaultValue={user?.name ?? ""} autoComplete="name" />
          <label htmlFor="checkout-phone">{t("phoneLabel")}</label>
          <input id="checkout-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" />
          <label htmlFor="checkout-city">{t("cityLabel")}</label>
          <input id="checkout-city" name="city" autoComplete="address-level2" />
          <label htmlFor="checkout-address">{t("addressLabel")}</label>
          <textarea id="checkout-address" name="address" rows={4} autoComplete="street-address" />
          <button className="button" type="submit">{t("placeDemoOrder")}</button>
        </form>
        <aside className="checkout-summary">
          <span>{number(items.length)} {t("availableWorks")}</span>
          <b>{formatTotal(total, locale)}</b>
        </aside>
      </div>
    </section>
  );
}
