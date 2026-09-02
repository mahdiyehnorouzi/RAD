"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useCartProducts } from "@/hooks/use-cart-products";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";
import { CheckoutForm } from "./checkout-form";
import { CheckoutSummary } from "./checkout-summary";

export function CheckoutPage() {
  const { t } = useLocale();
  const items = useCartProducts();
  const { cartTotal } = useMoney();
  const total = cartTotal(items);

  if (!items.length) {
    return (
      <PageSection>
        <h1 className="text-h2 font-normal">{t("emptyBag")}</h1>
        <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <header className="mb-10">
        <Eyebrow>{t("checkoutEyebrow")}</Eyebrow>
        <h1 className="m-0 text-h2 font-normal">{t("checkoutTitle")}</h1>
        <p className="mt-3 max-w-xl text-prose">{t("checkoutBody")}</p>
      </header>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
        <CheckoutForm />
        <CheckoutSummary count={items.length} total={total} />
      </div>
    </PageSection>
  );
}
