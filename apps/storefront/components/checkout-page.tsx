"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { ButtonLink, Button } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useCartProducts } from "@/hooks/use-cart-products";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";

export function CheckoutPage() {
  const { clear } = useCart();
  const { user, placeOrder } = useCommerce();
  const { t, href } = useLocale();
  const items = useCartProducts();
  const { cartTotal, formatTotal } = useMoney();
  const router = useRouter();
  const [error, setError] = useState("");
  const { number } = useLocale();
  const total = cartTotal(items);

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

  if (!items.length) {
    return (
      <PageSection>
        <h1 className="text-h2 font-normal">{t("emptyBag")}</h1>
        <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
      </PageSection>
    );
  }

  const fieldClass =
    "mb-4 min-h-12 w-full border-0 border-b border-rad-line bg-transparent px-0 py-2 outline-none focus:border-rad-clay";

  return (
    <PageSection>
      <header className="mb-10">
        <Eyebrow>{t("checkoutEyebrow")}</Eyebrow>
        <h1 className="m-0 text-h2 font-normal">{t("checkoutTitle")}</h1>
        <p className="mt-3 max-w-xl text-prose">{t("checkoutBody")}</p>
      </header>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
        <form className="grid" onSubmit={submitDemoOrder} noValidate>
          {error && (
            <p className="text-rad-clay" role="alert">
              {error}
            </p>
          )}
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
          <input
            className={fieldClass}
            id="checkout-city"
            name="city"
            autoComplete="address-level2"
          />
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
        <aside className="flex flex-col gap-2 border border-rad-line bg-rad-paper p-6">
          <span>
            {number(items.length)} {t("availableWorks")}
          </span>
          <b className="text-price font-normal">{formatTotal(total)}</b>
        </aside>
      </div>
    </PageSection>
  );
}
