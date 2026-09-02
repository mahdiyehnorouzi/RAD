"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useCart } from "@/components/cart/cart-provider";
import { useCartProducts } from "@/hooks/use-cart-products";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";
import { CartLine } from "./cart-line";
import { CartSummary } from "./cart-summary";

export function CartEmpty() {
  const { t, number } = useLocale();
  return (
    <PageSection>
      <Eyebrow>
        {t("bagEyebrow")} / {number(0)}
      </Eyebrow>
      <h1 className="text-h2 font-normal">{t("emptyBag")}</h1>
      <p className="mb-8 max-w-xl text-prose">{t("emptyBagBody")}</p>
      <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
    </PageSection>
  );
}

export function CartPage() {
  const { t, number } = useLocale();
  const { clear } = useCart();
  const items = useCartProducts();
  const { cartTotal } = useMoney();
  const total = cartTotal(items);

  if (!items.length) return <CartEmpty />;

  return (
    <PageSection>
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>
            {t("bagEyebrow")} / {number(items.length)}
          </Eyebrow>
          <h1 className="m-0 text-h2 font-normal">{t("shoppingBag")}</h1>
        </div>
        <button className="border-0 border-b border-current bg-transparent" onClick={clear}>
          {t("clearBag")}
        </button>
      </header>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]">
        <div className="grid gap-8">
          {items.map((product) => (
            <CartLine product={product} key={product.slug} />
          ))}
        </div>
        <CartSummary total={total} />
      </div>
    </PageSection>
  );
}
