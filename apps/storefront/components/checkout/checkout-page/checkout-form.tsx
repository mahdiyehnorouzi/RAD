"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { Button } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";

const fieldClass =
  "mb-4 min-h-12 w-full border-0 border-b border-rad-line bg-transparent px-0 py-2 outline-none focus:border-rad-clay";

export function CheckoutForm() {
  const { clear } = useCart();
  const { user, placeOrder } = useCommerce();
  const { t, href } = useLocale();
  const router = useRouter();
  const [error, setError] = useState("");

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
        name: name || user?.name || t("guestCollector"),
        city: city || t("tehranCity"),
        phone,
        address,
      });
      await clear();
      router.push(href("/orders"));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form className="grid" onSubmit={submitDemoOrder} noValidate>
      {error ? (
        <p className="text-rad-clay" role="alert">
          {error}
        </p>
      ) : null}
      <label htmlFor="checkout-name">{t("nameLabel")}</label>
      <input
        className={fieldClass}
        id="checkout-name"
        name="name"
        defaultValue={user?.name ?? ""}
        autoComplete="name"
      />
      <label htmlFor="checkout-phone">{t("phoneLabel")}</label>
      <input
        className={fieldClass}
        id="checkout-phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
      />
      <label htmlFor="checkout-city">{t("cityLabel")}</label>
      <input className={fieldClass} id="checkout-city" name="city" autoComplete="address-level2" />
      <label htmlFor="checkout-address">{t("addressLabel")}</label>
      <textarea
        className={`${fieldClass} resize-none`}
        id="checkout-address"
        name="address"
        rows={4}
        autoComplete="street-address"
      />
      <Button type="submit">{t("placeDemoOrder")}</Button>
    </form>
  );
}
