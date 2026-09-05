"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart";
import { cartTotal, formatTotal } from "@/lib/money";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { useCatalog } from "@/components/catalog";
import type { Product } from "@rad/types";

export function CheckoutPage() {
  const { slugs, clear } = useCart();
  const { user, placeOrder } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const { getProduct } = useCatalog();
  const router = useRouter();
  const [error, setError] = useState("");

  const items = slugs
    .map((slug) => getProduct(slug))
    .filter((item): item is Product => Boolean(item));
  const total = cartTotal(items, locale);

  const submitDemoOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();

    try {
      setError("");
      await placeOrder({
        name: name || user?.name || (locale === "fa" ? "کاربر رَد" : "RAD collector"),
        city: city || (locale === "fa" ? "تهران" : "Tehran"),
        phone,
        address,
      });
      await clear();
      router.push(href("/orders"));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!items.length) {
    return (
      <section className="cart-empty section">
        <h1>{t("emptyBag")}</h1>
        <ButtonLink href="/products">
          {t("viewWorks")}
        </ButtonLink>
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
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label htmlFor="checkout-name">{t("nameLabel")}</label>
          <input id="checkout-name" name="name" defaultValue={user?.name ?? ""} autoComplete="name" />
          <label htmlFor="checkout-phone">{t("phoneLabel")}</label>
          <input id="checkout-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" />
          <label htmlFor="checkout-city">{t("cityLabel")}</label>
          <input id="checkout-city" name="city" autoComplete="address-level2" />
          <label htmlFor="checkout-address">{t("addressLabel")}</label>
          <textarea className="resize-none" id="checkout-address" name="address" rows={4} autoComplete="street-address" />
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
