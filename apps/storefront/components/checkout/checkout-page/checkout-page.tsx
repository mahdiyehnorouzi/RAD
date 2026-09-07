"use client";
import "./checkout-page.css";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart";
import { cartTotal, formatTotal } from "@/lib/money";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { formatArtworkNumber, ProductMedia } from "@/components/product";
import { useCatalog } from "@/components/catalog";
import { productCopy } from "@/lib/catalog/products";
import { errorMessage } from "@/lib/api";
import type { Product } from "@rad/types";

export function CheckoutPage() {
  const { slugs, clear } = useCart();
  const { user, placeOrder } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const { getProduct } = useCatalog();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const items = slugs
    .map((slug) => getProduct(slug))
    .filter((item): item is Product => Boolean(item));
  const total = cartTotal(items, locale);
  const unavailable = items.filter(
    (item) => item.status === "sold" || item.status === "reserved",
  );

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
    errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [error]);

  const submitDemoOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const postalCode = String(data.get("postalCode") ?? "").trim();

    try {
      setError("");
      setSubmitting(true);
      const created = await placeOrder({
        name: name || user?.name || (locale === "fa" ? "کاربر رَد" : "RAD collector"),
        city: city || (locale === "fa" ? "تهران" : "Tehran"),
        phone,
        address: [address, postalCode && `${t("postalCodeLabel")} ${postalCode}`]
          .filter(Boolean)
          .join("، "),
      });
      await clear();
      router.push(href(`/orders/${created.id}`));
    } catch (err) {
      setError(errorMessage(err, t("requestFailed")));
    } finally {
      setSubmitting(false);
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
          {error ? (
            <p
              ref={errorRef}
              className="form-error"
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          ) : null}
          {unavailable.length ? (
            <p className="form-error" role="status">
              {t("workNoLongerAvailable")}
            </p>
          ) : null}
          <label htmlFor="checkout-name">{t("nameLabel")}</label>
          <input
            id="checkout-name"
            name="name"
            type="text"
            defaultValue={user?.name ?? ""}
            autoComplete="name"
          />
          <label htmlFor="checkout-phone">{t("phoneLabel")}</label>
          <input id="checkout-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" />
          <label htmlFor="checkout-city">{t("cityLabel")}</label>
          <input id="checkout-city" name="city" type="text" autoComplete="address-level2" />
          <label htmlFor="checkout-address">{t("addressLabel")}</label>
          <textarea
            className="resize-none"
            id="checkout-address"
            name="address"
            rows={4}
            autoComplete="street-address"
          />
          <label htmlFor="checkout-postal">{t("postalCodeLabel")}</label>
          <input
            id="checkout-postal"
            name="postalCode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
          />
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? t("placingOrder") : t("placeDemoOrder")}
          </button>
        </form>
        <aside className="checkout-summary">
          <span className="checkout-summary-title">{t("orderSummary")}</span>
          {items.map((product) => (
            <article className="checkout-summary-item" key={product.slug}>
              <span className="checkout-summary-art">
                <ProductMedia product={product} showStatusBadge={false} />
              </span>
              <div>
                <small>{formatArtworkNumber(product, number, locale)}</small>
                <h2>{productCopy(product, locale).name}</h2>
                <p>
                  {t("quantityLabel")}: {number(1)}
                </p>
              </div>
            </article>
          ))}
          <div className="checkout-summary-row">
            <span>{t("worksSubtotal")}</span>
            <b>{formatTotal(total, locale)}</b>
          </div>
          <div className="checkout-summary-row">
            <span>{t("deliveryCost")}</span>
            <b>{t("free")}</b>
          </div>
          <div className="checkout-summary-total">
            <span>{t("finalTotal")}</span>
            <b>{formatTotal(total, locale)}</b>
          </div>
        </aside>
      </div>
    </section>
  );
}
