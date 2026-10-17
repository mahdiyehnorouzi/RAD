"use client";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
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
import { PdpLightbox } from "./pdp-lightbox";
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
  const router = useRouter();
  const c = pdpCopy[locale];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const media = product.media ?? product.images ?? [];
  const galleryProduct = { ...product, images: media };
  const photographed = hasStudioPhotos(product);
  const slides: Slide[] = [
    ...Array.from({ length: Math.max(media.length, 1) }, (_, index): Slide => ({
      kind: "photo",
      index,
    })),
    ...(photographed ? [{ kind: "plate" } as const] : []),
  ];
  const count = slides.length;
  const { trackRef, active, goTo, onScroll, onKeyDown } =
    useGalleryTrack(count);
  useEffect(() => {
    trackRef.current
      ?.querySelectorAll("video")
      .forEach((video) => video.pause());
  }, [active, trackRef]);
  const format = (value: number) =>
    locale === "fa" ? number(value) : String(value);
  const recordNumber = formatArtworkNumber(product, number, locale);
  const PreviousIcon = locale === "fa" ? ArrowRight : ArrowLeft;
  const NextIcon = locale === "fa" ? ArrowLeft : ArrowRight;
  const BackIcon = locale === "fa" ? ChevronRight : ChevronLeft;

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.slug, url });
        return;
      } catch {
        // cancelled/unsupported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // nothing more we can do without clipboard access
    }
  };

  // The main stage image occupies ~42% of the 86rem PDP max-width on
  // desktop (gallery column is 0.72fr of a 1.72fr grid), going full-width
  // below the 1100px/700px breakpoints where the layout stacks. The thumb
  // rail is a fixed 5.25rem (84px, 4.25rem/68px from 1100px down).
  const renderSlide = (slide: Slide, context: "stage" | "thumb") => {
    const sizes =
      context === "stage"
        ? "(max-width: 700px) 100vw, (max-width: 1100px) 55vw, 42vw"
        : "84px";
    const item = slide.kind === "photo" ? media[slide.index] : undefined;
    if (item?.kind === "video") {
      return context === "thumb" ? (
        <span>▶ ویدیو</span>
      ) : (
        <video
          src={item.src}
          poster={item.thumbnail}
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          aria-label="ویدیوی اثر"
          onKeyDown={(event) => event.stopPropagation()}
        />
      );
    }
    return slide.kind === "photo" ? (
      <ProductMedia
        product={galleryProduct}
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
      className={`${className} ${styles.gallery}${photographed ? ` ${styles.photographed}` : ""}${count > 1 ? ` ${styles.hasThumbs}` : ""}${count > 2 ? ` ${styles.hasSecondary}` : ""}`}
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
        <div className={styles.stageHeader}>
          <button
            type="button"
            className={styles.headerIcon}
            onClick={() => router.back()}
            aria-label={c.back}
          >
            <BackIcon aria-hidden="true" />
          </button>
          <div className={styles.headerEnd}>
            <FavoriteButton slug={product.slug} compact />
            <button
              type="button"
              className={styles.headerIcon}
              onClick={() => void onShare()}
              aria-label={c.share}
            >
              <Share2 aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          ref={trackRef}
          className={styles.stageTrack}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          tabIndex={count > 1 ? 0 : -1}
        >
          {slides.map((slide, index) =>
            slide.kind === "photo" && media[slide.index]?.kind === "video" ? (
              <div
                key={`video-${slide.index}`}
                className={`${styles.slide} ${styles.photo}`}
                aria-label={`ویدیو ${format(index + 1)}`}
                inert={index !== active}
              >
                {renderSlide(slide, "stage")}
              </div>
            ) : (
              <button
                key={slide.kind === "photo" ? slide.index : "plate"}
                type="button"
                className={`${styles.slide} ${styles[slide.kind]}`}
                aria-roledescription={locale === "fa" ? "نما" : "slide"}
                aria-label={`${format(index + 1)} / ${format(count)}`}
                aria-hidden={index !== active}
                tabIndex={index === active ? 0 : -1}
                onClick={() => {
                  goTo(index);
                  setLightboxOpen(true);
                }}
                // Marks the real canonical hero image so the card->PDP overlay
                // (product-overlay.tsx) can detect when it has actually
                // decoded, instead of guessing with a timer.
                data-pdp-hero={index === 0 ? "true" : undefined}
                style={
                  index === 0
                    ? ({
                        viewTransitionName: `rad-pdp-image-${product.slug}`,
                      } as CSSProperties)
                    : undefined
                }
              >
                {renderSlide(slide, "stage")}
                {slide.kind === "plate" && recordNumber ? (
                  <span className={styles.plateMark} aria-hidden="true">
                    <b dir="ltr">{recordNumber}</b>
                    <i dir="ltr">{c.oneOfOne}</i>
                  </span>
                ) : null}
              </button>
            ),
          )}
        </div>
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
      {count > 2 ? (
        <div className={styles.secondaryGrid} aria-label={c.secondaryViews}>
          {slides.slice(1, 5).map((slide, offset) => {
            const index = offset + 1;
            return (
              <button
                key={slide.kind === "photo" ? slide.index : "plate"}
                type="button"
                className={styles.secondaryTile}
                onClick={() => {
                  goTo(index);
                  if (
                    slide.kind !== "photo" ||
                    media[slide.index]?.kind !== "video"
                  )
                    setLightboxOpen(true);
                }}
                aria-label={`${c.view} ${format(index + 1)}`}
              >
                {renderSlide(slide, "thumb")}
              </button>
            );
          })}
        </div>
      ) : null}
      {lightboxOpen ? (
        <PdpLightbox
          product={galleryProduct}
          slides={slides}
          active={active}
          count={count}
          onGoTo={goTo}
          onClose={() => setLightboxOpen(false)}
          renderSlide={(slide) => renderSlide(slide, "stage")}
        />
      ) : null}
    </div>
  );
}
