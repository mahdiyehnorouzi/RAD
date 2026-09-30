"use client";
import { useId } from "react";
import { Info, ShoppingBag } from "lucide-react";
import type { Artwork, Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { RadFingerprint } from "@/components/identity";
import type { RadPassport } from "@/components/passport/type";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { productCopy } from "@/lib/catalog/products";
import { productPrice } from "@/lib/money";
import { AddToBag } from "@/components/catalog/catalog/catalog";
import {
  formatArtworkNumber,
  formatRadDigits,
} from "@/components/product/listing";
import { PDP_ASSURANCES, pdpCopy } from "./const";
import type { LiveProduct } from "./hooks";
import { ProductHandmadeNote } from "./product-handmade-note";
import { ProductLiveNotice } from "./product-live-notice";
import { ProductRecordCards } from "./product-record-cards";
import { ProductSpecs } from "./product-specs";
import type { PurchaseState } from "./type";
import styles from "./product-summary.module.css";

export function ProductSummary({
  className,
  product,
  artwork,
  state,
  live,
  passport,
  qrSvg,
  textures,
}: {
  className: string;
  product: Product;
  artwork?: Artwork;
  state: PurchaseState;
  live: LiveProduct;
  passport?: RadPassport;
  qrSvg?: string;
  textures: WorkTexture[];
}) {
  const { locale, t, number } = useLocale();
  const c = pdpCopy[locale];
  const noteId = useId();
  const copy = productCopy(product, locale);
  const recordNumber = formatArtworkNumber(product, number, locale);
  const code = product.radNumber
    ? formatRadDigits(product.radNumber, number, locale)
    : undefined;
  const maker = product.vendor
    ? locale === "fa"
      ? product.vendor.displayName
      : product.vendor.displayNameEn
    : c.studio;
  const open = state.status === "available" && !state.inBag && !state.reserved;
  const availability = open ? c.available : state.label;
  const closed = state.sold || state.withdrawn;
  const change = artwork?.passport?.unexpectedChanges?.[locale];

  return (
    <div className={`${className} ${styles.summary}`}>
      <header className={styles.heading}>
        {recordNumber ? (
          <p className={styles.recordNo}>
            {product.radNumber ? (
              <RadFingerprint
                radNumber={product.radNumber}
                className={styles.recordPrint}
                animate
              />
            ) : null}
            <span>{recordNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{c.oneOfOne}</span>
          </p>
        ) : null}
        <h1>{copy.name}</h1>
        <p className={styles.lede}>{copy.subtitle}</p>
        <p className={styles.maker}>
          {c.byLine} <b>{maker}</b>
        </p>
      </header>

      <div className={styles.priceLine}>
        {availability ? (
          <span
            className={`${styles.availability}${open ? ` ${styles.open}` : ""}`}
          >
            {availability}
          </span>
        ) : null}
        <p className={styles.price}>{productPrice(product, locale)}</p>
      </div>

      <ProductLiveNotice
        product={product}
        live={live}
        inBag={state.inBag}
        reserved={state.reserved}
      />

      <div className={styles.buy}>
        {closed ? (
          <div className="add-to-bag">
            <button
              type="button"
              className="button add"
              disabled
              aria-describedby={state.sold ? noteId : undefined}
            >
              <ShoppingBag aria-hidden="true" />
              {t("addBag")}
            </button>
          </div>
        ) : (
          <AddToBag
            product={product}
            onConflict={() => void live.check()}
            icon={<ShoppingBag aria-hidden="true" />}
          />
        )}
        {state.sold ? (
          <p id={noteId} className={styles.buyNote}>
            <Info aria-hidden="true" />
            {c.soldNote}
          </p>
        ) : null}
      </div>

      {state.withdrawn ? null : (
        <ul className={styles.assurances}>
          {PDP_ASSURANCES.map(({ icon: Icon, title, detail }) => (
            <li key={title.en}>
              <Icon aria-hidden="true" />
              <b>{title[locale]}</b>
              <span>{detail[locale]}</span>
            </li>
          ))}
        </ul>
      )}

      <ProductHandmadeNote
        radNumber={product.radNumber}
        code={code}
        change={change}
      />

      <ProductRecordCards product={product} passport={passport} qrSvg={qrSvg} />

      <ProductSpecs
        product={product}
        artwork={artwork}
        passport={passport}
        textures={textures}
        index={0}
      />
    </div>
  );
}
