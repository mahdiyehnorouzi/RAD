"use client";
import { useEffect, useState } from "react";
import type { Artwork, FaqContent, Product } from "@rad/types";
import type { RadPassport } from "@/components/passport/type";
import { useLocale } from "@/components/i18n";
import { useProductStatus } from "@/hooks/use-product-status";
import { fetchFaq } from "@/lib/api";
import { overlayLiveProduct } from "@/lib/catalog/category-defaults";
import { workTextures } from "@/lib/catalog/material-texture";
import { isGoneStatus } from "@/lib/catalog/product-status";
import { useLiveProduct } from "./hooks";
import { MaterialTexture } from "./material-texture";
import { ProductAnatomy } from "./product-anatomy";
import { ProductCare } from "./product-care";
import { ProductGallery } from "./product-gallery";
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
  }, [locale]);

  const live = useLiveProduct(product.slug);
  const resolved = overlayLiveProduct(product, live.product);
  const textures = workTextures(resolved);

  const { inBag, reserved, label, status } = useProductStatus(resolved);
  const withdrawn = live.withdrawn && !inBag;
  const state: PurchaseState = {
    inBag,
    reserved,
    withdrawn,
    sold: !inBag && !reserved && !withdrawn && isGoneStatus(status),
    status,
    label,
  };

  return (
    <article className={styles.pdp}>
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
    </article>
  );
}
