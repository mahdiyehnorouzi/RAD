"use client";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useCart, cartTotal, formatTotal } from "./cart";
import { useCommerce } from "./commerce";
import { useLocale } from "./i18n";
import { products } from "@/lib/products";
type Details = { name: string; phone: string; city: string; address: string };
export function CheckoutPage() {
  const { slugs, clear } = useCart();
  const { user, addNotice, placeOrder } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const [details, setDetails] = useState<Details | null>(null);
  const [complete, setComplete] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const refs = { name: useRef<HTMLInputElement>(null), phone: useRef<HTMLInputElement>(null), city: useRef<HTMLInputElement>(null), address: useRef<HTMLTextAreaElement>(null) };
  const items = slugs.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean);
  const typedItems = items.filter((item): item is (typeof products)[number] => Boolean(item));
  const total = cartTotal(typedItems, locale);
  const totalToman = cartTotal(typedItems, "fa");
  const totalUsd = cartTotal(typedItems, "en");
  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const next = { name: String(data.get("name") ?? "").trim(), phone: String(data.get("phone") ?? "").trim(), city: String(data.get("city") ?? "").trim(), address: String(data.get("address") ?? "").trim() };
    const digits = next.phone.replace(/[^0-9۰-۹]/g, ""); const nextErrors: Partial<Record<keyof Details, string>> = {};
    if (next.name.length < 3) nextErrors.name = t("nameError"); if (digits.length < 10) nextErrors.phone = t("phoneError"); if (next.city.length < 2) nextErrors.city = t("cityError"); if (next.address.length < 8) nextErrors.address = t("addressError");
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); refs[(Object.keys(nextErrors) as (keyof Details)[])[0]].current?.focus(); return; }
    setErrors({}); setDetails(next);
  };
  const finish = () => { if (!details) return; placeOrder({ slugs: [...slugs], total: totalToman, usdTotal: totalUsd, delivery: { name: details.name, city: details.city } }); addNotice("order"); clear(); setComplete(true); };
  if (complete) return <section className="checkout-success section"><span className="eyebrow">{t("checkoutEyebrow")}</span><h1>{t("orderSuccessTitle")}</h1><p>{t("orderSuccessBody")}</p><div className="profile-actions"><Link className="button" href={href("/orders")}>{t("orders")}</Link><Link className="button outline" href={href("/")}>{t("returnHome")}</Link></div></section>;
  if (!items.length) return <section className="cart-empty section"><h1>{t("emptyBag")}</h1><Link className="button" href={href("/products")}>{t("viewWorks")}</Link></section>;
  const fieldError = (key: keyof Details) => errors[key] && <small id={`checkout-${key}-error`} className="field-error">{errors[key]}</small>;
  return <section className="checkout-page section"><header><span className="eyebrow">{t("checkoutEyebrow")}</span><h1>{t("checkoutTitle")}</h1><p>{t("checkoutBody")}</p></header><div className="checkout-grid">{!details ? <form className="checkout-form" onSubmit={submitDetails} noValidate>
    <label htmlFor="checkout-name">{t("nameLabel")}</label><input ref={refs.name} id="checkout-name" name="name" defaultValue={user?.name ?? ""} autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "checkout-name-error" : undefined} />{fieldError("name")}
    <label htmlFor="checkout-phone">{t("phoneLabel")}</label><input ref={refs.phone} id="checkout-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "checkout-phone-error" : undefined} />{fieldError("phone")}
    <label htmlFor="checkout-city">{t("cityLabel")}</label><input ref={refs.city} id="checkout-city" name="city" autoComplete="address-level2" required aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? "checkout-city-error" : undefined} />{fieldError("city")}
    <label htmlFor="checkout-address">{t("addressLabel")}</label><textarea ref={refs.address} id="checkout-address" name="address" rows={4} autoComplete="street-address" required aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? "checkout-address-error" : undefined} />{fieldError("address")}
    <button className="button" type="submit">{t("reviewOrder")}</button>
  </form> : <div className="checkout-review"><dl><div><dt>{t("nameLabel")}</dt><dd>{details.name}</dd></div><div><dt>{t("phoneLabel")}</dt><dd>{details.phone}</dd></div><div><dt>{t("cityLabel")}</dt><dd>{details.city}</dd></div><div><dt>{t("addressLabel")}</dt><dd>{details.address}</dd></div></dl><div className="profile-actions"><button className="button outline" type="button" onClick={() => setDetails(null)}>{t("editDetails")}</button><button className="button" type="button" onClick={finish}>{t("placeDemoOrder")}</button></div></div>}<aside className="checkout-summary"><span>{number(items.length)} {t("availableWorks")}</span><b>{formatTotal(total, locale)}</b></aside></div></section>;
}
