"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductMedia, ProductCard } from "./site";
import { AddToBag } from "./catalog";
import { useLocale } from "./i18n";
import { productCopy, products, type Product } from "@/lib/products";
import { productPrice } from "./cart";
import { FavoriteButton } from "./commerce";
import { Reviews } from "./reviews";

export function ProductDetail({ product }: { product: Product }) {
  const { locale, t, href } = useLocale();
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);

  const imageCount = product.images?.length ?? 1;

  const copy = productCopy(product, locale);
  const price = productPrice(product, locale);

  const category =
    product.category === "vases"
      ? t("filterVases")
      : product.category === "tableware"
        ? t("filterTableware")
        : t("filterSculpture");

  return (
    <>
      <section className="pdp section">
        <div className="pdp-topbar">
          <button
            type="button"
            className="back"
            onClick={() =>
              window.history.length > 1
                ? router.back()
                : router.push(href("/products"))
            }
          >
            {t("previousPage")}
          </button>
        </div>
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
      <Reviews product={product} />
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
