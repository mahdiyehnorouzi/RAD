"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Store } from "lucide-react";
import type { Product } from "@rad/types";
import { useCart } from "../cart-provider";
import { cartTotal, formatTotal } from "@/lib/money";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { StateNotice } from "@/components/ui/state-panel";
import { useLocale } from "@/components/i18n";
import { useCatalog } from "@/components/catalog";
import { CartPolicyNote } from "@/components/help";
import {
  EmptyBagState,
  ErrorState,
  StateScreen,
  StateWorks,
} from "@/components/states";
import {
  availableWorks,
  isGoneStatus,
  isReserved,
} from "@/lib/catalog/product-status";
import { cartCopy, fillCartCopy } from "../const";
import { CartHold } from "./cart-hold";
import { CartLine, priceChange, type CartLineIssue } from "./cart-line";
import { CartReleased } from "./cart-released";
import "./cart-page.css";

export function CartPage() {
  const { locale, t, number, href } = useLocale();
  const c = cartCopy[locale];
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
  const { products, getProduct, live: catalogLive } = useCatalog();
  const [removing, setRemoving] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [actionError, setActionError] = useState("");

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

  if (!ready) {
    return (
      <section className="cart-page section" aria-busy="true">
        <div className="cart-bag-body">
          <CardListSkeleton
            count={Math.max(1, Math.min(slugs.length, 3))}
            className="cart-skeleton"
          />
        </div>
      </section>
    );
  }

  if (loadError && !loaded) {
    return (
      <section className="cart-page section">
        <ErrorState
          layout="stack"
          as="h1"
          onRetry={() => void retry()}
          retrying={retrying}
          title="cartErrorTitle"
          body="cartErrorBody"
          back={{ href: "/products", label: "viewWorks" }}
        />
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
        <EmptyBagState
          suggestions={availableWorks(products, released)}
          notice={
            released.length ? (
              <div className="cart-empty-released">{releasedNotice}</div>
            ) : null
          }
        />
      </section>
    );

  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;
  const many = slugs.length > 1;
  const title = blocked
    ? c.blockedTitle
    : many
      ? fillCartCopy(c.addedManyTitle, { count: number(slugs.length) })
      : c.addedTitle;

  return (
    <section className="cart-page section">
      <StateScreen
        art="empty-bag"
        as="h1"
        className="cart-bag"
        title={title}
        body={<p>{blocked ? c.blockedBody : c.addedBody}</p>}
        badge={blocked ? undefined : <Check aria-hidden="true" />}
      >
        <div className="cart-bag-body">
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
          {priceMoved ? (
            <StateNotice>
              <p>{t("cartPriceChangedAlert")}</p>
            </StateNotice>
          ) : null}
          {releasedNotice}

          <ul className="cart-lines" aria-label={c.listLabel}>
            {lines.map((line) => (
              <li key={line.slug}>
                <CartLine
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
              </li>
            ))}
          </ul>

          {many ? (
            <div className="cart-bag-total">
              <div>
                <span>{t("finalTotal")}</span>
                <small>{c.shipping}</small>
              </div>
              <b>{formatTotal(total, locale)}</b>
            </div>
          ) : null}

          {blocked ? null : (
            <CartHold endsAt={holdEndsAt} count={slugs.length} />
          )}

          <div className="cart-bag-actions">
            {blocked || loadError ? (
              <Button disabled>
                {c.checkout}
                <ArrowIcon aria-hidden="true" />
              </Button>
            ) : (
              <ButtonLink href="/checkout">{c.checkout}</ButtonLink>
            )}
            <Link className="button outline" href={href("/products")}>
              <Store aria-hidden="true" />
              {c.browse}
            </Link>
          </div>

          {many ? (
            <button
              type="button"
              className="cart-bag-clear"
              disabled={clearing}
              onClick={async () => {
                setClearing(true);
                await runAction(clear);
                setClearing(false);
              }}
            >
              {clearing ? t("removing") : t("clearBag")}
            </button>
          ) : null}

          <CartPolicyNote />
        </div>
        <StateWorks
          title={t("stateAvailableWorks")}
          products={availableWorks(products, [...slugs, ...released])}
        />
      </StateScreen>
    </section>
  );
}
