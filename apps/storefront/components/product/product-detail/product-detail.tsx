"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  formatArtworkNumber,
  ProductCard,
  ProductGridSkeleton,
  ProductMedia,
} from "../listing";
import { AddToBag } from "../../catalog/catalog/catalog";
import { useLocale } from "@/components/i18n";
import type { Product } from "@rad/types";
import { categoryLabel } from "@/lib/catalog/artwork";
import { productCopy } from "@/lib/catalog/products";
import { productPrice } from "@/lib/money";
import { FavoriteButton } from "@/components/commerce";
import {
  ChevronDown,
  PackageCheck,
  Palette,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useCatalog } from "../../catalog/catalog-provider";
import {
  hasRealProductImage,
  overlayLiveProduct,
} from "@/lib/catalog/category-defaults";
import { CategoryDetailIcon, CategoryOrbitItems } from "./category-orbit-items";
import "./product-detail.css";

export function ProductDetail({ product }: { product: Product }) {
  const { locale, t, number } = useLocale();
  const carouselRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const [motion, setMotion] = useState({
    current: 0,
    previous: null as number | null,
    sequence: 0,
  });
  const { products, getProduct, loading } = useCatalog();
  const catalogProduct = getProduct(product.slug);
  const visual =
    catalogProduct && hasRealProductImage(catalogProduct)
      ? catalogProduct
      : hasRealProductImage(product)
        ? product
        : (catalogProduct ?? product);
  const resolved = overlayLiveProduct(
    overlayLiveProduct(visual, product),
    catalogProduct,
  );

  const imageCount = Math.max(resolved.images?.length ?? 0, 1);

  const copy = productCopy(resolved, locale);
  const price = productPrice(resolved, locale);
  const sceneCount = Math.max(
    imageCount,
    Math.min(Math.max(copy.details.length, 1), 3),
  );

  const category = categoryLabel(resolved.category, locale);
  const artworkNumber = formatArtworkNumber(resolved, number, locale);
  const recordNumber =
    artworkNumber || (locale === "fa" ? "در انتظار شماره" : "NUMBER PENDING");

  const transitionTo = useCallback(
    (target?: number) => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      setMotion((state) => {
        const next =
          target === undefined
            ? (state.current + 1) % sceneCount
            : ((target % sceneCount) + sceneCount) % sceneCount;

        if (next === state.current) return state;

        return {
          current: next,
          previous: reducedMotion ? null : state.current,
          sequence: state.sequence + 1,
        };
      });

      if (!reducedMotion) {
        transitionTimeoutRef.current = window.setTimeout(() => {
          setMotion((state) => ({ ...state, previous: null }));
          transitionTimeoutRef.current = null;
        }, 1050);
      }
    },
    [sceneCount],
  );

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let interval: number | null = null;

    const updateAutoplay = () => {
      if (interval !== null) window.clearInterval(interval);
      interval = preference.matches
        ? null
        : window.setInterval(() => transitionTo(), 3300);
    };

    updateAutoplay();
    preference.addEventListener("change", updateAutoplay);

    return () => {
      if (interval !== null) window.clearInterval(interval);
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      preference.removeEventListener("change", updateAutoplay);
    };
  }, [transitionTo]);

  const sceneStyle = (sceneIndex: number) => {
    const media = resolved.images?.[sceneIndex % imageCount];
    return {
      "--pdp-scene-color": media?.color ?? resolved.color ?? "var(--sand)",
      "--pdp-scene-accent": media?.accent ?? resolved.accent ?? "var(--clay)",
    } as CSSProperties;
  };

  const sceneDetails = () => {
    const details = [
      copy.subtitle,
      ...copy.details.filter((detail) => detail !== copy.subtitle),
    ];
    return Array.from(
      { length: Math.min(3, Math.max(details.length, 1)) },
      (_, row) => details[row % details.length],
    );
  };

  const renderArtScene = (
    sceneIndex: number,
    phase: "entering" | "leaving",
  ) => (
    <div
      key={`${phase}-${sceneIndex}-${motion.sequence}`}
      className={`pdp-motion-scene is-${phase} scene-${sceneIndex % 3}`}
      style={sceneStyle(sceneIndex)}
      aria-hidden={phase === "leaving" ? "true" : undefined}
    >
      <div className="pdp-color-field" />
      <strong className="pdp-giant-name">{copy.name}</strong>
      <CategoryOrbitItems category={resolved.category} />
      <div className="pdp-moving-art">
        <ProductMedia
          product={resolved}
          imageIndex={sceneIndex % imageCount}
          showStatusBadge={phase === "entering"}
        />
      </div>
    </div>
  );

  const renderDetailScene = (
    sceneIndex: number,
    phase: "entering" | "leaving",
  ) => (
    <ul
      key={`details-${phase}-${sceneIndex}-${motion.sequence}`}
      className={`pdp-specs is-${phase}`}
      aria-hidden={phase === "leaving" ? "true" : undefined}
    >
      {sceneDetails().map((detail, index) => (
        <li
          key={`${detail}-${index}`}
          style={{ "--row": index } as CSSProperties}
        >
          <CategoryDetailIcon category={resolved.category} index={index} />
          <b>{detail}</b>
          <i>{locale === "fa" ? number(index + 1) : `0${index + 1}`}</i>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <section className="pdp section">
        <div className="pdp-showcase">
          <div className="pdp-gallery" aria-live="off">
            <div className="pdp-main-art">
              {motion.previous !== null
                ? renderArtScene(motion.previous, "leaving")
                : null}
              {renderArtScene(motion.current, "entering")}
            </div>
            <div
              className="pdp-detail-art"
              role="group"
              aria-label={t("imageNumber")}
            >
              <button
                type="button"
                className="pdp-scene-arrow"
                onClick={() => transitionTo(motion.current - 1)}
                aria-label={t("previousWorks")}
              >
                ←
              </button>
              <div className="pdp-scene-dots">
                {Array.from({ length: sceneCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={motion.current === index ? "active" : ""}
                    onClick={() => transitionTo(index)}
                    aria-pressed={motion.current === index}
                    aria-label={`${t("imageNumber")} ${locale === "fa" ? new Intl.NumberFormat("fa-IR").format(index + 1) : index + 1}`}
                  >
                    <span />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="pdp-scene-arrow"
                onClick={() => transitionTo()}
                aria-label={t("nextWorks")}
              >
                →
              </button>
            </div>
          </div>
          <div className="pdp-info">
            <div className="pdp-record">
              <span>{locale === "fa" ? "ثبت آرشیو" : "ARCHIVE RECORD"}</span>
              <strong>{recordNumber}</strong>
              <i>{locale === "fa" ? "۱ / ۱" : "1 / 1"}</i>
            </div>
            <span className="eyebrow">
              {category} ·{" "}
              {resolved.status === "reserved"
                ? t("reserved")
                : resolved.status === "sold"
                  ? t("soldOut")
                  : t("uniqueAvailable")}
            </span>
            <h1>{copy.name}</h1>
            <p className="subtitle">{copy.subtitle}</p>
            <p className="price">{price}</p>
            <div className="pdp-material-heading">
              <span>
                {locale === "fa" ? "مواد و جزئیات ساخت" : "MATERIALS & MAKING"}
              </span>
              <small>{category}</small>
            </div>
            <div className="pdp-spec-motion">
              {motion.previous !== null
                ? renderDetailScene(motion.previous, "leaving")
                : null}
              {renderDetailScene(motion.current, "entering")}
            </div>
            <p className="pdp-story">{copy.story}</p>
            <div className="pdp-actions">
              <AddToBag product={resolved} />
              <FavoriteButton slug={resolved.slug} />
            </div>
            <p className="shipping">{t("shipping")}</p>
          </div>
        </div>
      </section>
      <section className="section shipping-faq">
        <header>
          <span className="eyebrow">
            {locale === "fa" ? "ارسال آثار رَد" : "RAD DELIVERY"}
          </span>
          <h2>{locale === "fa" ? "پیش از خرید بدانید" : "Before you buy"}</h2>
        </header>
        <div className="faq-list">
          {(locale === "fa"
            ? [
                [
                  "اگر اثر در ارسال آسیب ببیند؟",
                  "تمام آثار بیمه‌اند. آسیب را تا ۲۴ ساعت با عکس اعلام کنید؛ رَد مسئول پیگیری و جبران است.",
                ],
                [
                  "بسته‌بندی چگونه است؟",
                  "هر اثر در جعبه دولایه، با محافظ متناسب با فرم و شناسنامه امضاشده ارسال می‌شود.",
                ],
                [
                  "زمان و محدوده ارسال؟",
                  "تهران ۲ تا ۴ روز کاری و شهرستان ۴ تا ۸ روز کاری؛ ارسال بیمه‌شده رایگان است.",
                ],
                [
                  "رنگ، متریال و مرجوعی",
                  "نور نمایشگر می‌تواند رنگ و بافت را کمی تغییر دهد. آثار آماده تا ۴۸ ساعت امکان درخواست بازگشت دارند؛ سفارش شخصی مرجوع نمی‌شود.",
                ],
              ]
            : [
                [
                  "What if it is damaged?",
                  "Every work is insured. Report damage with photos within 24 hours; RAD manages the resolution.",
                ],
                [
                  "How is it packed?",
                  "Each work travels in a double box with form-fitted protection and a signed certificate.",
                ],
                [
                  "When will it arrive?",
                  "Tehran: 2–4 working days. Other cities: 4–8. Insured delivery is complimentary.",
                ],
                [
                  "Colour, material, and returns",
                  "Screens may shift colour and texture slightly. Ready works can be returned within 48 hours; custom works cannot be returned.",
                ],
              ]
          ).map(([q, a], index) => {
            const icons = [ShieldCheck, PackageCheck, Truck, Palette];
            const Icon = icons[index];
            return (
              <details key={q}>
                <summary>
                  <span className="faq-title">
                    <Icon aria-hidden="true" />
                    {q}
                  </span>
                  <ChevronDown className="faq-chevron" aria-hidden="true" />
                </summary>
                <p>{a}</p>
              </details>
            );
          })}
        </div>
      </section>
      <section className="section related">
        <header className="section-heading">
          <div>
            <span className="eyebrow">{t("relatedEyebrow")}</span>
            <h2>{t("moreWorks")}</h2>
          </div>
          <div className="carousel-controls">
            <button
              type="button"
              aria-label={t("previousWorks")}
              onClick={() =>
                carouselRef.current?.scrollBy({
                  left: -carouselRef.current.clientWidth * 0.75,
                  behavior: "smooth",
                })
              }
            >
              ←
            </button>
            <button
              type="button"
              aria-label={t("nextWorks")}
              onClick={() =>
                carouselRef.current?.scrollBy({
                  left: carouselRef.current.clientWidth * 0.75,
                  behavior: "smooth",
                })
              }
            >
              →
            </button>
          </div>
        </header>
        <div ref={carouselRef} className="related-carousel">
          {loading ? (
            <ProductGridSkeleton count={3} className="related-carousel" />
          ) : (
            products
              .filter((item) => item.slug !== resolved.slug)
              .map((item, index) => (
                <ProductCard key={item.slug} product={item} index={index} />
              ))
          )}
        </div>
      </section>
    </>
  );
}
