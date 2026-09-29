"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ObjectStamp, RadFingerprint } from "@/components/identity";
import type { Product } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";
import { formatRadDigits } from "../listing";
import { productCopy } from "@/lib/catalog/products";
import { passportYear } from "@/lib/passport";
import { qrMedia } from "./const";
import { ProductQrActions } from "./product-qr-actions";
import "./product-qr.css";

const media = {
  "--qr-plaster": `url(${qrMedia.plaster})`,
  "--qr-slab": `url(${qrMedia.slab})`,
  "--qr-slab-rim": `url(${qrMedia.slabRim})`,
  "--qr-deckle": `url(${qrMedia.deckle})`,
} as CSSProperties;

export function ProductQr({
  product,
  targetUrl,
  qrSvg,
  made,
}: {
  product: Product;
  targetUrl: string;
  qrSvg: string;
  /** The work's recorded making date, for the seal. */
  made?: LocaleCopy;
}) {
  const { locale, t, number } = useLocale();
  const copy = productCopy(product, locale);
  const code = product.radNumber
    ? formatRadDigits(product.radNumber, number, locale)
    : undefined;
  const year = made ? passportYear({ dateCreated: made }, locale) : undefined;

  return (
    <section className="product-qr" style={media}>
      <div className="product-qr-still" aria-hidden="true">
        <span className="product-qr-slab-rim" />
        <span className="product-qr-slab" />
        <Image
          className="product-qr-sprig"
          src={qrMedia.sprig}
          alt=""
          width={320}
          height={345}
          sizes="12rem"
          priority
        />
        <svg className="product-qr-thread" viewBox="0 0 200 520" preserveAspectRatio="none" focusable="false">
          <path
            d="M150 0c20 40 30 80 8 120s-38 60-16 104 44 86 18 136-70 70-100 60"
            pathLength={1}
          />
        </svg>
      </div>

      <header className="product-qr-intro">
        <span className="product-qr-kicker">{t("productQrEyebrow")}</span>
        <h1>{t("productQrTitle")}</h1>
        <p>{t("productQrBody")}</p>
      </header>

      <article className="product-qr-label">
        <span className="product-qr-paper" aria-hidden="true" />
        {product.radNumber && code ? (
          <ObjectStamp
            className="product-qr-seal"
            radNumber={product.radNumber}
            code={code}
            year={year}
            label={[`RĀD ${code}`, t("oneOfOne"), year]
              .filter(Boolean)
              .join(locale === "fa" ? "، " : ", ")}
          />
        ) : null}
        <span className="product-qr-brand">
          {product.radNumber ? (
            <RadFingerprint radNumber={product.radNumber} density="field" />
          ) : null}
          <span dir="ltr">
            RĀD
            <small>OBJECT</small>
          </span>
        </span>

        <div className="product-qr-meta">
          <h2>{copy.name}</h2>
          {copy.subtitle ? <p>{copy.subtitle}</p> : null}
        </div>

        <figure
          className="product-qr-code"
          aria-label={t("productQrTitle")}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        <div className="product-qr-target">
          <span>{t("productQrScanTarget")}</span>
          <b dir="ltr">{targetUrl}</b>
        </div>
      </article>

      <ProductQrActions targetUrl={targetUrl} productHref={`/products/${product.slug}`} />
    </section>
  );
}
