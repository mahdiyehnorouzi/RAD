"use client";
import { useRef, useState } from "react";
import { ProductCard, ProductMedia } from "../listing";
import { AddToBag } from "../../catalog/catalog/catalog";
import { useLocale } from "@/components/i18n";
import type { Product } from "@rad/types";
import { categoryLabel, productCopy } from "@/lib/catalog";
import { productPrice } from "@/lib/money";
import { FavoriteButton } from "@/components/commerce";
import { ChevronDown, PackageCheck, Palette, ShieldCheck, Truck } from "lucide-react";
import { useCatalog } from "../../catalog/catalog-provider";
import "./product-detail.css";

export function ProductDetail({ product }: { product: Product }) {
  const { locale, t } = useLocale();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const { products } = useCatalog();

  const imageCount = product.images?.length ?? 1;

  const copy = productCopy(product, locale);
  const price = productPrice(product, locale);

  const category = categoryLabel(product.category, locale);

  return (
    <>
      <section className="pdp section">
        <div className="pdp-gallery">
          <div className="pdp-main-art">
            <span className="edition">{locale === "fa" ? "۱/۱" : "1/1"}</span>
            <ProductMedia product={product} imageIndex={activeImage} />
          </div>
          <div className="pdp-detail-art">
            {Array.from({ length: Math.max(imageCount, 1) }, (_, index) => (
              <button
                key={index}
                type="button"
                className={activeImage === index ? "active" : ""}
                onClick={() => setActiveImage(index)}
                aria-label={`${t("imageNumber")} ${locale === "fa" ? new Intl.NumberFormat("fa-IR").format(index + 1) : index + 1}`}
              >
                <ProductMedia product={product} imageIndex={index} />
              </button>
            ))}
          </div>
        </div>
        <div className="pdp-info">
          <span className="eyebrow">
            {category} · {t("uniqueAvailable")}
          </span>
          <h1>{copy.name}</h1>
          <p className="subtitle">{copy.subtitle}</p>
          <p className="price">{price}</p>
          <p className="pdp-story">{copy.story}</p>
          <FavoriteButton slug={product.slug} />
          <ul>
            {copy.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <AddToBag product={product} />
          <p className="shipping">{t("shipping")}</p>
        </div>
      </section>
      <section className="section shipping-faq">
        <header><span className="eyebrow">{locale === "fa" ? "ارسال آثار رَد" : "RAD DELIVERY"}</span><h2>{locale === "fa" ? "پیش از خرید بدانید" : "Before you buy"}</h2></header>
        <div className="faq-list">{(locale === "fa" ? [
          ["اگر اثر در ارسال آسیب ببیند؟", "تمام آثار بیمه‌اند. آسیب را تا ۲۴ ساعت با عکس اعلام کنید؛ رَد مسئول پیگیری و جبران است."],
          ["بسته‌بندی چگونه است؟", "هر اثر در جعبه دولایه، با محافظ متناسب با فرم و شناسنامه امضاشده ارسال می‌شود."],
          ["زمان و محدوده ارسال؟", "تهران ۲ تا ۴ روز کاری و شهرستان ۴ تا ۸ روز کاری؛ ارسال بیمه‌شده رایگان است."],
          ["رنگ، متریال و مرجوعی", "نور نمایشگر می‌تواند رنگ و بافت را کمی تغییر دهد. آثار آماده تا ۴۸ ساعت امکان درخواست بازگشت دارند؛ سفارش شخصی مرجوع نمی‌شود."]
        ] : [
          ["What if it is damaged?", "Every work is insured. Report damage with photos within 24 hours; RAD manages the resolution."],
          ["How is it packed?", "Each work travels in a double box with form-fitted protection and a signed certificate."],
          ["When will it arrive?", "Tehran: 2–4 working days. Other cities: 4–8. Insured delivery is complimentary."],
          ["Colour, material, and returns", "Screens may shift colour and texture slightly. Ready works can be returned within 48 hours; custom works cannot be returned."]
        ]).map(([q,a], index) => {
          const icons = [ShieldCheck, PackageCheck, Truck, Palette];
          const Icon = icons[index];
          return (
            <details key={q}>
              <summary>
                <span className="faq-title"><Icon aria-hidden="true" />{q}</span>
                <ChevronDown className="faq-chevron" aria-hidden="true" />
              </summary>
              <p>{a}</p>
            </details>
          );
        })}</div>
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
          {products
            .filter((item) => item.slug !== product.slug)
            .map((item, index) => (
              <ProductCard key={item.slug} product={item} index={index} />
            ))}
        </div>
      </section>
    </>
  );
}
