"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { useProductStatus } from "@/hooks/use-product-status";
import { hasStudioPhotos } from "@/lib/catalog/photo-works";
import { productCopy } from "@/lib/catalog/products";
import { productFullPriceParts } from "@/lib/money";
import {
  formatArtworkNumber,
  formatRadDigits,
  productCardCopy,
} from "../const";
import type {
  ProductBadgeTone,
  ProductCardSlide,
  ProductCardVariant,
} from "../type";
import { ProductCardQr } from "./product-card-qr";
import { ProductCardPrint } from "./product-card-print";
import { ProductCardStage } from "./product-card-stage";
import { ProductCardThumbs } from "./product-card-thumbs";
import "../product-grid.css";
import "./product-card.css";

const RAIL_LIMIT = 4;

export function ProductCard({
  product,
  variant = "standard",
  popular = false,
  forceCategoryArtwork = false,
}: {
  product: Product;
  variant?: ProductCardVariant;
  /** Only when real demand data says so; the badge never appears on its own. */
  popular?: boolean;
  forceCategoryArtwork?: boolean;
}) {
  const { locale, href, number } = useLocale();
  const c = productCardCopy[locale];
  const copy = productCopy(product, locale);
  const { status, label, inBag, reserved, purchasable } =
    useProductStatus(product);
  const [activeSlide, setActiveSlide] = useState(0);

  const productHref = href(`/products/${product.slug}`);
  const artworkNumber = formatArtworkNumber(product, number, locale);
  const digits = Number(product.artworkNumber?.replace(/\D/g, "") || 0);
  const markDigits = digits ? formatRadDigits(digits, number, locale) : "";
  const price = productFullPriceParts(product, locale);
  const maker = product.vendor
    ? locale === "fa"
      ? product.vendor.displayName
      : product.vendor.displayNameEn
    : c.maker;
  const unavailable = Boolean(status) && !purchasable && !inBag;
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  const badge: { tone: ProductBadgeTone; label: string } | null = inBag
    ? { tone: "bag", label: c.inBag }
    : status === "sold" && !reserved && label
      ? { tone: "sold", label }
      : popular && purchasable
        ? { tone: "popular", label: c.popular }
        : label && status !== "available"
          ? { tone: "neutral", label }
          : null;

  const slides: ProductCardSlide[] =
    variant === "featured" && !forceCategoryArtwork
      ? [
          ...Array.from(
            { length: Math.max(product.images?.length ?? 0, 1) },
            (_, index): ProductCardSlide => ({ kind: "photo", index }),
          ),
          ...(hasStudioPhotos(product) ? [{ kind: "plate" } as const] : []),
        ]
      : [{ kind: "photo", index: 0 }];
  const railSlides = slides.slice(0, RAIL_LIMIT);

  const stage = (
    <ProductCardStage
      product={product}
      productHref={productHref}
      slide={slides[activeSlide]}
      markDigits={markDigits}
      badge={badge}
      forceCategoryArtwork={forceCategoryArtwork}
    />
  );

  const info = (
    <div className="rad-card-info">
      <h3 className="rad-card-name">
        <Link href={productHref}>{copy.name}</Link>
      </h3>
      <p className="rad-card-maker">
        {c.by} <b>{maker}</b>
      </p>
      {artworkNumber ? (
        <span className="rad-card-no" dir="ltr">
          {artworkNumber}
        </span>
      ) : null}
      <p className="rad-card-price">
        <b>{price.amount}</b>
        {price.unit ? <span>{price.unit}</span> : null}
      </p>
    </div>
  );

  const qr = (caption?: string) => (
    <ProductCardQr product={product} name={copy.name} caption={caption} />
  );

  const className = `rad-card rad-card--${variant}${unavailable ? " is-unavailable" : ""}`;

  if (variant === "featured") {
    return (
      <article
        className={`${className}${railSlides.length > 1 ? " has-rail" : ""}`}
      >
        {railSlides.length > 1 ? (
          <ProductCardThumbs
            product={product}
            slides={railSlides}
            hidden={slides.length - railSlides.length}
            active={activeSlide}
            onSelect={setActiveSlide}
            productHref={productHref}
          />
        ) : null}
        <div className="rad-card-main">
          {stage}
          <div className="rad-card-body">
            {info}
            {copy.subtitle ? (
              <div className="rad-card-lede">
                <p>{copy.subtitle}</p>
              </div>
            ) : null}
            {qr(c.studio)}
            <ProductCardPrint radNumber={product.radNumber} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={className}>
      {stage}
      <div className="rad-card-body">
        {info}
        {variant === "standard" ? qr(c.studio) : qr("RĀD")}
        {variant === "suggest" ? (
          <Link
            href={productHref}
            className="rad-card-go"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Arrow aria-hidden="true" />
          </Link>
        ) : null}
        {variant === "standard" ? (
          <ProductCardPrint radNumber={product.radNumber} />
        ) : null}
      </div>
    </article>
  );
}
