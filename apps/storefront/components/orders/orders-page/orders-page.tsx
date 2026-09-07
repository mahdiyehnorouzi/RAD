"use client";
import "./orders-page.css";

import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { productCopy } from "@/lib/catalog/products";
import { formatTotal } from "@/lib/money";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { ProductMedia } from "@/components/product";
import { useCatalog } from "@/components/catalog";
import { AccountShell } from "../../account/account-shell";
import { STORE_ORDER_STATUS_KEY, radArtworkNumber } from "../const";

export function OrdersPage() {
  const { orders } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const { products, getProduct } = useCatalog();

  return (
    <AccountShell requireAuth>
      <section className="orders-page section">
        <header className="orders-heading">
          <span className="eyebrow">{t("ordersEyebrow")}</span>
          <h1>{t("ordersTitle")}</h1>
          <p>{t("ordersShopNote")}</p>
        </header>
        {orders.length ? (
          <div className="orders-list">
            {orders.map((order) => {
              const product = getProduct(order.slugs[0] ?? "");
              const usdTotal =
                order.usdTotal ??
                order.slugs.reduce(
                  (sum, slug) => sum + (getProduct(slug)?.usdPrice ?? 0),
                  0,
                );
              return (
                <article className="order-card" key={order.id}>
                  <header>
                    <div>
                      <PackageCheck aria-hidden="true" />
                      <span>{t("orderId")}</span>
                      <b dir="ltr">{order.id}</b>
                    </div>
                    <span className="order-status">
                      {t(STORE_ORDER_STATUS_KEY[order.status])}
                    </span>
                  </header>
                  <p className="order-type-label">{t("collectionPurchase")}</p>
                  {product ? (
                    <div className="order-artwork">
                      <Link href={href(`/products/${product.slug}`)} className="order-art">
                        <ProductMedia product={product} showStatusBadge={false} />
                      </Link>
                      <div>
                        <h2>
                          <Link href={href(`/products/${product.slug}`)}>
                            {productCopy(product, locale).name}
                          </Link>
                        </h2>
                        <p>
                          {t("artworkNumber")}: {radArtworkNumber(product.slug, products)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <dl>
                    <div>
                      <dt>{t("orderDate")}</dt>
                      <dd>
                        {new Intl.DateTimeFormat(
                          locale === "fa" ? "fa-IR" : "en-US",
                          { dateStyle: "medium" },
                        ).format(order.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("orderItems")}</dt>
                      <dd>{number(order.slugs.length)}</dd>
                    </div>
                  </dl>
                  <strong>
                    {formatTotal(locale === "fa" ? order.total : usdTotal, locale)}
                  </strong>
                  <ButtonLink href={`/orders/${order.id}`}>
                    {t("trackOrder")}
                  </ButtonLink>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h2>{t("noOrders")}</h2>
            <ButtonLink href="/products">{t("viewAvailableWorks")}</ButtonLink>
          </div>
        )}
      </section>
    </AccountShell>
  );
}
