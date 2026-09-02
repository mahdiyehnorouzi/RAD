"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { ProductMedia } from "@/components/product/product-media";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { productCopy } from "@/lib/products";
import { useCart } from "@/components/cart/cart-provider";
import { useCartProducts } from "@/hooks/use-cart-products";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";

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
  const { locale, t, href, number } = useLocale();
  const { remove, clear } = useCart();
  const items = useCartProducts();
  const { cartTotal, formatTotal, productPrice } = useMoney();
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
        <button
          className="border-0 border-b border-current bg-transparent"
          onClick={clear}
        >
          {t("clearBag")}
        </button>
      </header>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]">
        <div className="grid gap-8">
          {items.map((product) => (
            <article
              className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-start gap-4"
              key={product.slug}
            >
              <Link
                href={href(`/products/${product.slug}`)}
                className="relative grid h-24 w-24 place-items-center overflow-hidden bg-rad-sand"
              >
                <ProductMedia product={product} />
              </Link>
              <div>
                <span className="text-caption text-rad-muted">
                  {t("uniquePiece")}
                </span>
                <h2 className="m-0 text-lg font-normal">
                  <Link href={href(`/products/${product.slug}`)}>
                    {productCopy(product, locale).name}
                  </Link>
                </h2>
                <p className="m-0 text-sm text-rad-muted">
                  {productCopy(product, locale).subtitle}
                </p>
                <button
                  className="mt-2 border-0 border-b border-current bg-transparent text-sm"
                  onClick={() => remove(product.slug)}
                >
                  {t("removeBag")}
                </button>
              </div>
              <strong className="text-price font-normal">
                {productPrice(product)}
              </strong>
            </article>
          ))}
        </div>
        <aside className="flex flex-col gap-4 border border-rad-line bg-rad-paper p-6">
          <span>{t("orderSummary")}</span>
          <div className="flex justify-between">
            <span>{t("worksSubtotal")}</span>
            <b className="font-medium">{formatTotal(total)}</b>
          </div>
          <div className="flex justify-between">
            <span>{t("insuredShipping")}</span>
            <b className="font-medium">{t("free")}</b>
          </div>
          <div className="flex justify-between border-t border-rad-line pt-3">
            <span>{t("finalTotal")}</span>
            <b className="font-medium">{formatTotal(total)}</b>
          </div>
          <ButtonLink href="/checkout">{t("checkout")}</ButtonLink>
          <small className="text-rad-muted">{t("checkoutNote")}</small>
        </aside>
      </div>
    </PageSection>
  );
}
