"use client";
import Link from "next/link";
import { useCart, cartTotal, formatTotal, productPrice } from "./cart";
import { ButtonLink, ProductMedia } from "./site";
import { productCopy } from "@/lib/products";
import { useLocale } from "./i18n";
import { useCatalog } from "./catalog-provider";

export function CartPage() {
  const { locale, t, href, number } = useLocale();
  const { slugs, remove, clear } = useCart();
  const { getProduct } = useCatalog();

  const items = slugs.map((slug) => getProduct(slug)).filter(Boolean);
  const total = cartTotal(
    items.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    locale,
  );

  if (!items.length)
    return (
      <section className="cart-empty section">
        <span className="eyebrow">
          {t("bagEyebrow")} / {number(0)}
        </span>
        <h1>{t("emptyBag")}</h1>
        <p>{t("emptyBagBody")}</p>
        <ButtonLink href="/products">
          {t("viewWorks")}
        </ButtonLink>
      </section>
    );

  return (
    <section className="cart-page section">
      <header className="cart-heading">
        <div>
          <span className="eyebrow">
            {t("bagEyebrow")} / {number(items.length)}
          </span>
          <h1>{t("shoppingBag")}</h1>
        </div>
        <button className="text-button" onClick={clear}>
          {t("clearBag")}
        </button>
      </header>
      <div className="cart-layout">
        <div className="cart-list">
          {items.map(
            (product) =>
              product && (
                <article className="cart-item" key={product.slug}>
                  <Link
                    href={href(`/products/${product.slug}`)}
                    className="cart-art"
                  >
                    <ProductMedia product={product} />
                  </Link>
                  <div className="cart-item-copy">
                    <span>{t("uniquePiece")}</span>
                    <h2>
                      <Link href={href(`/products/${product.slug}`)}>
                        {productCopy(product, locale).name}
                      </Link>
                    </h2>
                    <p>{productCopy(product, locale).subtitle}</p>
                    <button onClick={() => remove(product.slug)}>
                      {t("removeBag")}
                    </button>
                  </div>
                  <strong>{productPrice(product, locale)}</strong>
                </article>
              ),
          )}
        </div>
        <aside className="cart-summary">
          <span>{t("orderSummary")}</span>
          <div>
            <span>{t("worksSubtotal")}</span>
            <b>{formatTotal(total, locale)}</b>
          </div>
          <div>
            <span>{t("insuredShipping")}</span>
            <b>{t("free")}</b>
          </div>
          <div className="cart-total">
            <span>{t("finalTotal")}</span>
            <b>{formatTotal(total, locale)}</b>
          </div>
          <ButtonLink href="/checkout">
            {t("checkout")}
          </ButtonLink>
          <small>{t("checkoutNote")}</small>
        </aside>
      </div>
    </section>
  );
}
