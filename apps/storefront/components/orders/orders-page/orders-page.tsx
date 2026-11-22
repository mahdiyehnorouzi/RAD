"use client";
import "./orders-page.css";

import Link from "next/link";
import { PackageCheck, Truck } from "lucide-react";
import { productCopy } from "@/lib/catalog/products";
import { formatTotal } from "@/lib/money";
import { useOrders } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { ProductMedia } from "@/components/product";
import { useCatalog } from "@/components/catalog";
import { AccountShell } from "../../account/account-shell";
import { AccountHeading } from "../../account/account-heading";
import { StateScreen } from "@/components/states";
import {
  ORDER_STATUS_TONE,
  STORE_ORDER_STATUS_KEY,
  radArtworkNumber,
} from "../const";
import { orderCardNext } from "../order-card-next";

export function OrdersPage({ embedded = false }: { embedded?: boolean }) {
  const { orders, ready } = useOrders();
  const { locale, t, href } = useLocale();
  const { products, getProduct } = useCatalog();

  const page = (
    <section className="orders-page section">
      <AccountHeading
        icon={Truck}
        title={t("ordersTitle")}
        body={t("ordersShopNote")}
      />
      {!ready ? null : orders.length ? (
        <div className="orders-list">
          {orders.map((order) => {
            const product = getProduct(order.slugs[0] ?? "");
            return (
              <article className="order-card" key={order.id}>
                <header>
                  <div>
                    <PackageCheck aria-hidden="true" />
                    <span>{t("orderId")}</span>
                    <b dir="ltr">{order.id}</b>
                  </div>
                  <time dateTime={new Date(order.createdAt).toISOString()}>
                    {new Intl.DateTimeFormat(
                      locale === "fa" ? "fa-IR" : "en-US",
                      { dateStyle: "medium" },
                    ).format(order.createdAt)}
                  </time>
                  <span
                    className="order-status"
                    data-tone={ORDER_STATUS_TONE[order.status]}
                  >
                    {t(STORE_ORDER_STATUS_KEY[order.status])}
                  </span>
                </header>
                <p className="order-type-label">{t("collectionPurchase")}</p>
                {product ? (
                  <div className="order-artwork">
                    <Link
                      href={href(`/products/${product.slug}`)}
                      className="order-art"
                    >
                      <ProductMedia
                        product={product}
                        showStatusBadge={false}
                        sizes="(max-width: 600px) 5.5rem, 6.5rem"
                      />
                    </Link>
                    <div>
                      <h2>
                        <Link href={href(`/products/${product.slug}`)}>
                          {productCopy(product, locale).name}
                        </Link>
                      </h2>
                      <p>
                        {t("artworkNumber")}:{" "}
                        {radArtworkNumber(product.slug, products)}
                      </p>
                    </div>
                  </div>
                ) : null}
                <p className="order-next-line">
                  {orderCardNext(order.status, locale)}
                </p>
                <strong>{formatTotal(order.total, locale)}</strong>
                <ButtonLink href={`/orders/${order.id}`}>
                  {t("trackOrder")}
                </ButtonLink>
              </article>
            );
          })}
        </div>
      ) : (
        <StateScreen
          art="empty-bag"
          className="account-state"
          title={t("noOrders")}
          actions={
            <ButtonLink href="/products">{t("viewAvailableWorks")}</ButtonLink>
          }
        />
      )}
    </section>
  );

  if (embedded) return page;
  return <AccountShell requireAuth>{page}</AccountShell>;
}
