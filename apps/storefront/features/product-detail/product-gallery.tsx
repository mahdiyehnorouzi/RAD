"use client";
import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@rad/types";
import { FavoriteButton } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { hasStudioPhotos } from "@/lib/catalog/photo-works";
import {
  formatArtworkNumber,
  ProductMedia,
} from "@/components/product/listing";
import { pdpCopy } from "./const";
import { useGalleryTrack } from "./hooks";
import styles from "./product-gallery.module.css";

type Slide = { kind: "photo"; index: number } | { kind: "plate" };

export function ProductGallery({
  product,
  className,
}: {
  product: Product;
  className: string;
}) {
  const { locale, number } = useLocale();
  const c = pdpCopy[locale];
  const photographed = hasStudioPhotos(product);
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

  // The main stage image occupies ~42% of the 86rem PDP max-width on
  // desktop (gallery column is 0.72fr of a 1.72fr grid), going full-width
  // below the 1100px/700px breakpoints where the layout stacks. The thumb
  // rail is a fixed 5.25rem (84px, 4.25rem/68px from 1100px down).
  const renderSlide = (slide: Slide, context: "stage" | "thumb") => {
    const sizes =
      context === "stage"
        ? "(max-width: 700px) 100vw, (max-width: 1100px) 55vw, 42vw"
        : "84px";
    return slide.kind === "photo" ? (
      <ProductMedia
        product={product}
        imageIndex={slide.index}
        showStatusBadge={false}
        priority={context === "stage" && slide === slides[0]}
        sizes={sizes}
      />
    ) : (
      <ProductMedia
        product={product}
        imageIndex={0}
        showStatusBadge={false}
        preserveTransparentBackground
        priority={context === "stage" && slide === slides[0]}
        sizes={sizes}
      />
    );
  };

  return (
    <div
      className={`${className} ${styles.gallery}${photographed ? ` ${styles.photographed}` : ""}${count > 1 ? ` ${styles.hasThumbs}` : ""}`}
      style={
        {
          "--plate-color": product.color,
          "--plate-accent": product.accent,
        } as CSSProperties
      }
    >
      <div
        className={styles.stage}
        role="region"
        aria-roledescription={locale === "fa" ? "گالری" : "carousel"}
        aria-label={c.gallery}
      >
        <div
          ref={trackRef}
          className={styles.stageTrack}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          tabIndex={count > 1 ? 0 : -1}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.kind === "photo" ? slide.index : "plate"}
              className={`${styles.slide} ${styles[slide.kind]}`}
              role="group"
              aria-roledescription={locale === "fa" ? "نما" : "slide"}
              aria-label={`${format(index + 1)} / ${format(count)}`}
              aria-hidden={index !== active}
            >
              {renderSlide(slide, "stage")}
              {slide.kind === "plate" && recordNumber ? (
                <span className={styles.plateMark} aria-hidden="true">
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
            <div className={styles.stageNav}>
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
            <span className={styles.stageCount} aria-live="polite">
              <bdi dir="ltr">
                {format(active + 1)} / {format(count)}
              </bdi>
            </span>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className={styles.thumbs} role="group" aria-label={c.views}>
          {slides.map((slide, index) => (
            <button
              key={slide.kind === "photo" ? slide.index : "plate"}
              type="button"
              className={`${styles.thumb} ${styles[slide.kind]}${index === active ? ` ${styles.active}` : ""}`}
              onClick={() => goTo(index)}
              aria-pressed={index === active}
              aria-label={
                slide.kind === "plate"
                  ? c.plate
                  : `${c.view} ${format(index + 1)}`
              }
            >
              <span aria-hidden="true">{renderSlide(slide, "thumb")}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
