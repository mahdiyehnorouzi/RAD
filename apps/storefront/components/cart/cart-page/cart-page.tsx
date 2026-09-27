"use client";
import { useState } from "react";
import type { Product } from "@rad/types";
import { useCart } from "../cart-provider";
import { cartTotal, formatTotal } from "@/lib/money";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { StateNotice, StatePanel } from "@/components/ui/state-panel";
import { useLocale } from "@/components/i18n";
import { useCatalog } from "@/components/catalog";
import { useCountdown } from "@/hooks/use-countdown";
import {
  formatCountdown,
  isGoneStatus,
  isReserved,
} from "@/lib/catalog/product-status";
import { CartLine, priceChange, type CartLineIssue } from "./cart-line";
import { CartReleased } from "./cart-released";
import "./cart-page.css";

export function CartPage() {
  const { locale, t, number } = useLocale();
  const {
    slugs,
    holds,
    prices,
    holdEndsAt,
    released,
    dismissReleased,
    ready,
    loaded,
    loadError,
    reload,
    add,
    remove,
    clear,
  } = useCart();
  const {
    getProduct,
    loading: catalogLoading,
    status: catalogStatus,
  } = useCatalog();
  const remaining = useCountdown(holdEndsAt);
  const [removing, setRemoving] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [actionError, setActionError] = useState("");
  const catalogLive = catalogStatus === "live";

  const lines = slugs.map((slug) => {
    const product = getProduct(slug);
    const mine = Boolean(holds[slug]);
    let issue: CartLineIssue = null;
    if (!product) issue = catalogLive ? "withdrawn" : null;
    else if (!mine) {
      if (isReserved(product)) issue = "reserved";
      else if (isGoneStatus(product.status)) issue = "sold";
      else issue = "unavailable";
    }
    const changed =
      product && catalogLive ? priceChange(product, prices[slug]) : null;
    return { slug, product, issue, changed };
  });
  const blocked = lines.some((line) => line.issue || !line.product);
  const priceMoved = lines.some((line) => line.changed && !line.issue);
  const payable = lines
    .filter((line) => !line.issue)
    .map((line) => line.product)
    .filter((item): item is Product => Boolean(item));
  const total = cartTotal(payable, locale);

  const retry = async () => {
    setRetrying(true);
    try {
      await reload();
    } finally {
      setRetrying(false);
    }
  };
  const retryButton = (
    <button
      type="button"
      className="state-action"
      onClick={() => void retry()}
      disabled={retrying}
    >
      {retrying ? t("retrying") : t("retry")}
    </button>
  );

  const runAction = async (action: () => Promise<void>) => {
    setActionError("");
    try {
      await action();
    } catch {
      setActionError(t("cartActionFailed"));
    }
  };

  const heading = (count: number) => (
    <div>
      <span className="eyebrow">
        {t("bagEyebrow")} / {number(count)}
      </span>
      <h1>{t("shoppingBag")}</h1>
    </div>
  );

  if (!ready || (slugs.length > 0 && catalogLoading)) {
    return (
      <section className="cart-page section" aria-busy="true">
        <header className="cart-heading">{heading(slugs.length)}</header>
        <CardListSkeleton
          count={Math.max(1, Math.min(slugs.length, 3))}
          className="cart-skeleton"
        />
      </section>
    );
  }

  if (loadError && !loaded) {
    return (
      <section className="cart-page section">
        <StatePanel
          tone="error"
          as="h1"
          eyebrow={t("bagEyebrow")}
          title={t("cartErrorTitle")}
          actions={retryButton}
        >
          <p>{t("cartErrorBody")}</p>
        </StatePanel>
      </section>
    );
  }

  const releasedNotice = (
    <CartReleased
      slugs={released}
      getProduct={getProduct}
      onAdd={add}
      onDismiss={dismissReleased}
    />
  );

  if (!slugs.length)
    return (
      <section className="cart-empty section">
        <span className="eyebrow">
          {t("bagEyebrow")} / {number(0)}
        </span>
        <h1>{t("emptyBag")}</h1>
        <p>{t("emptyBagBody")}</p>
        {released.length ? (
          <div className="cart-empty-released">{releasedNotice}</div>
        ) : null}
        <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
      </section>
    );

  return (
    <section className="cart-page section">
      <header className="cart-heading">
        {heading(slugs.length)}
        <button
          className="text-button"
          disabled={clearing}
          onClick={async () => {
            setClearing(true);
            await runAction(clear);
            setClearing(false);
          }}
        >
          {clearing ? t("removing") : t("clearBag")}
        </button>
      </header>
      <div className="cart-notices">
        {loadError ? (
          <StateNotice tone="error" action={retryButton}>
            <p>{t("cartErrorBody")}</p>
          </StateNotice>
        ) : null}
        {actionError ? (
          <StateNotice tone="error">
            <p>{actionError}</p>
          </StateNotice>
        ) : null}
        {releasedNotice}
        {blocked ? (
          <StateNotice tone="error">
            <p>{t("workNoLongerAvailable")}</p>
          </StateNotice>
        ) : remaining !== null ? (
          <StateNotice live="off">
            <p>
              {t("holdCountdown", {
                time: formatCountdown(remaining, locale, number),
              })}
            </p>
          </StateNotice>
        ) : null}
        {priceMoved ? (
          <StateNotice>
            <p>{t("cartPriceChangedAlert")}</p>
          </StateNotice>
        ) : null}
      </div>
      <div className="cart-layout">
        <div className="cart-list">
          {lines.map((line) => (
            <CartLine
              key={line.slug}
              slug={line.slug}
              product={line.product}
              issue={line.issue}
              changed={line.changed}
              removing={removing === line.slug}
              onRemove={async () => {
                setRemoving(line.slug);
                await runAction(() => remove(line.slug));
                setRemoving(null);
              }}
            />
          ))}
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
          {blocked || loadError ? (
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
