"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import type { Product } from "@rad/types";
import { formatArtworkNumber } from "../listing";
import { productCopy } from "@/lib/catalog/products";
import { ProductQrActions } from "./product-qr-actions";
import "./product-qr.css";

export function ProductQr({
  product,
  targetUrl,
  qrSvg,
}: {
  product: Product;
  targetUrl: string;
  qrSvg: string;
}) {
  const { locale, t, number, href } = useLocale();
  const copy = productCopy(product, locale);
  const artworkNumber = formatArtworkNumber(product, number, locale);

  return (
    <section className="product-qr section">
      <header className="product-qr-intro">
        <span className="eyebrow">{t("productQrEyebrow")}</span>
        <h1>{t("productQrTitle")}</h1>
        <p>{t("productQrBody")}</p>
      </header>

      <article className="product-qr-label">
        <div className="product-qr-meta">
          <span>{artworkNumber || (locale === "fa" ? "بدون شماره" : "Unnumbered")}</span>
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
        <Link className="product-qr-back" href={href(`/products/${product.slug}`)}>
          {t("productQrViewProduct")}
        </Link>
      </div>
    </section>
  );
}
