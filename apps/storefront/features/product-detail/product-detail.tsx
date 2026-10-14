"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { Artwork, FaqContent, Product } from "@rad/types";
import type { RadPassport } from "@/components/passport/type";
import { useLocale } from "@/components/i18n";
import { useProductStatus } from "@/hooks/use-product-status";
import { fetchFaq } from "@/lib/api";
import { overlayLiveProduct } from "@/lib/catalog/category-defaults";
import { workTextures } from "@/lib/catalog/material-texture";
import { isGoneStatus } from "@/lib/catalog/product-status";
import { DevPurchaseStateReader } from "./dev-purchase-state-reader";
import { useInView, useLiveProduct } from "./hooks";
import { MaterialTexture } from "./material-texture";
import { ProductAnatomy } from "./product-anatomy";
import { ProductCare } from "./product-care";
import { ProductGallery } from "./product-gallery";
import { ProductFloatingBuy } from "./product-floating-buy";
import { ProductMaking } from "./product-making";
import { ProductQuestions } from "./product-questions";
import { ProductStory } from "./product-story";
import { ProductSummary } from "./product-summary";
import { RelatedWorks } from "./related-works";
import type { PurchaseState } from "./type";
import styles from "./product-detail.module.css";

/** A glaze named anywhere in the work's recorded materials. */
function isGlazed(artwork?: Artwork) {
  const materials = artwork?.materials;
  return [materials?.body, materials?.surface, materials?.process].some(
    (text) => text && /لعاب|glaz/i.test(`${text.fa} ${text.en}`),
  );
}

export function ProductDetail({
  product,
  artwork,
  passport,
  related,
  initialFaq = null,
  qrSvg,
}: {
  product: Product;
  artwork?: Artwork;
  passport?: RadPassport;
  /** Other works to suggest, already chosen and ordered by the server. */
  related: Product[];
  initialFaq?: FaqContent | null;
  qrSvg?: string;
}) {
  const { locale } = useLocale();
  const [faq, setFaq] = useState<FaqContent | null>(initialFaq);

  useEffect(() => {
    // The server already fetched FAQ for the current locale (`initialFaq`),
    // and switching locale is a full page navigation (see `switchLocale` in
    // `components/i18n.tsx`), so there is never a locale change to react to
    // here. Only fall back to a client fetch when the server fetch failed.
    if (initialFaq !== null) return undefined;
    let active = true;
    fetchFaq(locale)
      .then((payload) => {
        if (active) setFaq(payload);
      })
      .catch(() => {
        if (active) setFaq(null);
      });
    return () => {
      active = false;
    };
  }, [locale, initialFaq]);

  // The floating bar is the inline CTA's understudy: it only appears once
  // the real inline Add to Bag button (observed via `buyRef`) has scrolled
  // out of view, so the two are never both on screen at once.
  const { ref: buyRef, inView: inlineBuyInView } = useInView<HTMLDivElement>();
  // While the inline AddToBag's confirmation sheet is open, the floating bar
  // is suppressed (never unmounted — same pattern as its scroll-visibility
  // hide) so the two never show a competing "go to bag" CTA at once.
  const [sheetOpen, setSheetOpen] = useState(false);

  const live = useLiveProduct(product.slug);
  const resolved = overlayLiveProduct(product, live.product);
  const textures = workTextures(resolved);

  const { inBag, reserved, label, status } = useProductStatus(resolved);
  const withdrawn = live.withdrawn && !inBag;
  const baseState: PurchaseState = {
    inBag,
    reserved,
    withdrawn,
    sold: !inBag && !reserved && !withdrawn && isGoneStatus(status),
    status,
    label,
  };
  // Dev-only override so every purchase-bar visual state can be inspected
  // against a real product without touching cart/inventory logic.
  // `DevPurchaseStateReader` — and the `useSearchParams()` it needs — is
  // only ever mounted below when `isDev`, so production's render tree never
  // reaches it (conditionally mounting a child component doesn't violate
  // rules-of-hooks the way conditionally calling a hook would).
  const isDev = process.env.NODE_ENV !== "production";
  const [devOverride, setDevOverride] = useState<Partial<PurchaseState> | null>(
    null,
  );
  const [devState, setDevState] = useState<string | null>(null);
  const handleDevStateChange = useCallback(
    (override: Partial<PurchaseState> | null, ds: string | null) => {
      setDevOverride(override);
      setDevState(ds);
    },
    [],
  );
  const devBusy = devState === "loading";
  const state: PurchaseState = devOverride
    ? { ...baseState, ...devOverride }
    : baseState;

  useEffect(() => {
    document.documentElement.setAttribute("data-pdp-bare", "true");
    return () => document.documentElement.removeAttribute("data-pdp-bare");
  }, []);

  return (
    <article className={styles.pdp}>
      {isDev ? (
        <Suspense fallback={null}>
          <DevPurchaseStateReader onChange={handleDevStateChange} />
        </Suspense>
      ) : null}
      <div className={styles.top}>
        <ProductGallery product={resolved} className={styles.gallery} />
        <ProductSummary
          className={styles.summary}
          product={resolved}
          artwork={artwork}
          state={state}
          live={live}
          passport={passport}
          qrSvg={qrSvg}
          textures={textures}
          buyRef={buyRef}
          onSheetVisibleChange={setSheetOpen}
        />
        <div className={styles.rest}>
          <ProductStory
            product={resolved}
            artwork={artwork}
            textures={textures}
            index={1}
          />
          <ProductAnatomy
            product={resolved}
            artwork={artwork}
            textures={textures}
            index={2}
          />
          <ProductMaking
            product={resolved}
            artwork={artwork}
            passport={passport}
            textures={textures}
            index={3}
          />
          <ProductCare
            text={(artwork?.care ?? passport?.care)?.[locale]}
            glazed={isGlazed(artwork)}
            textures={textures}
            index={4}
          />
          <div className={styles.foldList}>
            <ProductQuestions
              faq={faq}
              showShipping={!state.sold && !state.withdrawn}
              textures={textures}
              index={5}
            />
          </div>
          <MaterialTexture
            texture={textures[0]}
            shape="strip"
            className={styles.restStrip}
          />
          <RelatedWorks works={related} />
        </div>
      </div>
      <ProductFloatingBuy
        product={resolved}
        state={state}
        live={live}
        forceBusy={devBusy}
        visible={!inlineBuyInView && !sheetOpen}
      />
    </article>
  );
}
