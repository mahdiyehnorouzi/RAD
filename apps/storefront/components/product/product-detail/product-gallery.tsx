"use client";
import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@rad/types";
import { FavoriteButton } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { catalogLifestylePhotoSlugs } from "@/lib/catalog/photo-works";
import { formatArtworkNumber, ProductMedia } from "../listing";
import { pdpCopy } from "./const";
import { useGalleryTrack } from "./hooks";

type Slide = { kind: "photo"; index: number } | { kind: "plate" };

export function ProductGallery({ product }: { product: Product }) {
  const { locale, number } = useLocale();
  const c = pdpCopy[locale];
  const photographed = catalogLifestylePhotoSlugs.has(product.slug);
  const slides: Slide[] = [
    ...Array.from(
      { length: Math.max(product.images?.length ?? 0, 1) },
      (_, index): Slide => ({ kind: "photo", index }),
    ),
    ...(photographed ? [{ kind: "plate" } as const] : []),
  ];
  const count = slides.length;
  const { trackRef, active, goTo, onScroll, onKeyDown } =
    useGalleryTrack(count);
  const format = (value: number) =>
    locale === "fa" ? number(value) : String(value);
  const recordNumber = formatArtworkNumber(product, number, locale);
  const PreviousIcon = locale === "fa" ? ArrowRight : ArrowLeft;
  const NextIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  const renderSlide = (slide: Slide) =>
    slide.kind === "photo" ? (
      <ProductMedia
        product={product}
        imageIndex={slide.index}
        showStatusBadge={false}
      />
    ) : (
      <ProductMedia
        product={product}
        imageIndex={0}
        showStatusBadge={false}
        preserveTransparentBackground
      />
    );

  return (
    <div
      className={`pdp-gallery${photographed ? " is-photographed" : ""}${count > 1 ? " has-thumbs" : ""}`}
      style={
        {
          "--plate-color": product.color,
          "--plate-accent": product.accent,
        } as CSSProperties
      }
    >
      <div
        className="pdp-stage"
        role="region"
        aria-roledescription={locale === "fa" ? "گالری" : "carousel"}
        aria-label={c.gallery}
      >
        <div
          ref={trackRef}
          className="pdp-stage-track"
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          tabIndex={count > 1 ? 0 : -1}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.kind === "photo" ? slide.index : "plate"}
              className={`pdp-slide is-${slide.kind}`}
              role="group"
              aria-roledescription={locale === "fa" ? "نما" : "slide"}
              aria-label={`${format(index + 1)} / ${format(count)}`}
              aria-hidden={index !== active}
            >
              {renderSlide(slide)}
              {slide.kind === "plate" && recordNumber ? (
                <span className="pdp-plate-mark" aria-hidden="true">
                  <b dir="ltr">{recordNumber}</b>
                  <i dir="ltr">{c.oneOfOne}</i>
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <FavoriteButton slug={product.slug} compact />
        {count > 1 ? (
          <>
            <div className="pdp-stage-nav">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                disabled={active === 0}
                aria-label={c.previousView}
              >
                <PreviousIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                disabled={active === count - 1}
                aria-label={c.nextView}
              >
                <NextIcon aria-hidden="true" />
              </button>
            </div>
            <span className="pdp-stage-count" aria-live="polite">
              <bdi dir="ltr">
                {format(active + 1)} / {format(count)}
              </bdi>
            </span>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="pdp-thumbs" role="group" aria-label={c.views}>
          {slides.map((slide, index) => (
            <button
              key={slide.kind === "photo" ? slide.index : "plate"}
              type="button"
              className={`pdp-thumb is-${slide.kind}${index === active ? " is-active" : ""}`}
              onClick={() => goTo(index)}
              aria-pressed={index === active}
              aria-label={
                slide.kind === "plate"
                  ? c.plate
                  : `${c.view} ${format(index + 1)}`
              }
            >
              <span aria-hidden="true">{renderSlide(slide)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
