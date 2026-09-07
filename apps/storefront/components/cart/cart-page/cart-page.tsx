"use client";
import Link from "next/link";
import { useCart } from "../cart-provider";
import { cartTotal, formatTotal, productPrice } from "@/lib/money";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { ProductMedia } from "@/components/product";
import { CardListSkeleton, Skeleton, SkeletonScreen } from "@/components/ui/skeleton";
import { productCopy } from "@/lib/catalog/products";
import { useLocale } from "@/components/i18n";
import { useCatalog } from "@/components/catalog";
import "./cart-page.css";

export function CartPage() {
  const { locale, t, href, number } = useLocale();
  const { slugs, remove, clear, ready } = useCart();
  const { getProduct, loading: catalogLoading } = useCatalog();

  const items = slugs.map((slug) => getProduct(slug)).filter(Boolean);
  const unavailable = items.some(
    (item) => item && (item.status === "sold" || item.status === "reserved"),
  );
  const total = cartTotal(
    items.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    locale,
  );

  if (!ready || (slugs.length > 0 && catalogLoading && !items.length)) {
    return (
      <section className="cart-page section">
        <SkeletonScreen>
          <Skeleton className="skeleton-line short" />
          <Skeleton className="skeleton-line" style={{ width: "12rem", height: "2.4rem" }} />
          <CardListSkeleton count={2} />
        </SkeletonScreen>
      </section>
    );
  }

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
      {unavailable ? (
        <p className="cart-alert" role="alert">
          {t("workNoLongerAvailable")}
        </p>
      ) : null}
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
                    <span className="cart-media">
                      <ProductMedia product={product} />
                    </span>
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
          {unavailable ? (
            <Button disabled>{t("checkout")}</Button>
          ) : (
            <ButtonLink href="/checkout">{t("checkout")}</ButtonLink>
          )}
          <small>{t("checkoutNote")}</small>
        </aside>
      </div>
    </section>
  );
}
