"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Store } from "lucide-react";
import type { Product } from "@rad/types";
import { useCart } from "../cart-provider";
import { cartTotal, formatTotal } from "@/lib/money";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { StateNotice } from "@/components/ui/state-panel";
import { useLocale } from "@/components/i18n";
import { useCatalog } from "@/components/catalog";
import "@/components/checkout/flow/purchase-design.css";
import { CheckoutSteps } from "@/components/checkout/flow";
import { ErrorState } from "@/components/states";
import {
  availableWorks,
  isGoneStatus,
  isReserved,
} from "@/lib/catalog/product-status";
import { cartCopy } from "../const";
import { resolveCartBackMode, type CartBackMode } from "../cart-back";
import { CartEmpty } from "../cart-empty";
import { hasNavigatedInApp } from "@/features/navigation/app-navigation";
import { CartHold } from "./cart-hold";
import { CartLine, priceChange, type CartLineIssue } from "./cart-line";
import { CartReleased } from "./cart-released";
import styles from "./cart-page.module.css";

export function CartPage() {
  const { locale, t, number, href } = useLocale();
  const c = cartCopy[locale];
  const router = useRouter();
  // Cart can be reached by following a link within the site (checkout
  // retreat, header icon, an order page) or by a direct hit, a refresh, or
  // an external link — see app-navigation.ts for why `hasNavigatedInApp()`
  // is the reliable way to tell those apart. Decided once on mount so it
  // doesn't flip under a predictable Back control while the page is
  // visible; read in an effect, not during render, so this client-only
  // module state is never read while this component is server-rendered.
  const [backMode, setBackMode] = useState<CartBackMode>("fallback");
  useEffect(() => {
    setBackMode(resolveCartBackMode(hasNavigatedInApp()));
  }, []);
  const canGoBack = backMode === "replay-history";
  const {
    slugs,
    count,
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
  const total = cartTotal(payable);

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
      <section className={`${styles.page} section`} aria-busy="true">
        <div className={styles.body}>
          <CardListSkeleton
            count={Math.max(1, Math.min(slugs.length, 3))}
            className={styles.skeleton}
          />
        </div>
      </section>
    );
  }

  if (loadError && !loaded) {
    return (
      <section className={`${styles.page} section`}>
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
      <CartEmpty
        suggestions={availableWorks(products, released)}
        released={released.length ? releasedNotice : null}
      />
    );

  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;
  const BackArrowIcon = locale === "fa" ? ArrowRight : ArrowLeft;
  const many = slugs.length > 1;
  return (
    <section className={`${styles.page} section purchase-bag`}>
      <CheckoutSteps current={0} />
      {canGoBack ? (
        <button
          type="button"
          className={styles.back}
          onClick={() => router.back()}
        >
          <BackArrowIcon aria-hidden="true" />
          {t("back")}
        </button>
      ) : (
        <Link className={styles.back} href={href("/products")}>
          <BackArrowIcon aria-hidden="true" />
          {t("back")}
        </Link>
      )}
      <h1 className={styles.title}>
        {locale === "fa" ? "کیسه خرید" : "Shopping bag"} ({number(count)})
      </h1>
      <div className={styles.body}>
        <div className={styles.mainCol}>
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

          <ul className={styles.lines} aria-label={c.listLabel}>
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
        </div>

        <div className={styles.asideCol}>
          {!blocked ? (
            <div className={styles.total}>
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

          <div className={styles.actions}>
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
              className={styles.clear}
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
        </div>
      </div>
    </section>
  );
}
