"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { ObjectStamp, RadFingerprint } from "@/components/identity";
import type { Product } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";
import { formatArtworkNumber, formatRadDigits } from "../listing";
import { productCopy } from "@/lib/catalog/products";
import { passportYear } from "@/lib/passport";
import { ProductQrActions } from "./product-qr-actions";
import "./product-qr.css";

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
  const { locale, t, number, href } = useLocale();
  const copy = productCopy(product, locale);
  const artworkNumber = formatArtworkNumber(product, number, locale);
  const code = product.radNumber
    ? formatRadDigits(product.radNumber, number, locale)
    : undefined;
  const year = made ? passportYear({ dateCreated: made }, locale) : undefined;

  return (
    <section className="product-qr section">
      <header className="product-qr-intro">
        <span className="eyebrow">{t("productQrEyebrow")}</span>
        <h1>{t("productQrTitle")}</h1>
        <p>{t("productQrBody")}</p>
      </header>

      <article className="product-qr-label">
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
        <div className="product-qr-meta">
          <span className="product-qr-number">
            {product.radNumber ? (
              <RadFingerprint radNumber={product.radNumber} />
            ) : null}
            {artworkNumber || (locale === "fa" ? "بدون شماره" : "Unnumbered")}
          </span>
          <h2>{copy.name}</h2>
          <p>{copy.subtitle}</p>
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

      <div className="product-qr-toolbar">
        <ProductQrActions targetUrl={targetUrl} />
        <Link
          className="product-qr-back"
          href={href(`/products/${product.slug}`)}
        >
          {t("productQrViewProduct")}
        </Link>
      </div>
    </section>
  );
}
