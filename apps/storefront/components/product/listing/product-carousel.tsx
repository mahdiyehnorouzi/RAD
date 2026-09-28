"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { productCardCopy } from "./const";
import { ProductCard } from "./product-card";
import type { ProductCardVariant } from "./type";
import "./product-carousel.css";

/** Snap track of cards; arrows and dots appear only when the works overflow. */
export function ProductCarousel({
  products,
  label,
  variant = "compact",
  className = "",
}: {
  products: Product[];
  label: string;
  variant?: Exclude<ProductCardVariant, "featured">;
  className?: string;
}) {
  const { locale, number } = useLocale();
  const c = productCardCopy[locale];
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [overflow, setOverflow] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const rtl = locale === "fa";

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const box = track.getBoundingClientRect();
    const edge = rtl ? box.right : box.left;
    let nearest = 0;
    let distance = Infinity;
    Array.from(track.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const gap = Math.abs((rtl ? rect.right : rect.left) - edge);
      if (gap < distance) {
        distance = gap;
        nearest = index;
      }
    });
    setActive(nearest);
    setOverflow(track.scrollWidth > track.clientWidth + 1);
    setAtEnd(
      Math.abs(track.scrollLeft) + track.clientWidth >= track.scrollWidth - 2,
    );
  }, [rtl]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure, products.length]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const item = track?.children[index];
    if (!track || !item) return;
    const box = track.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: rtl ? rect.right - box.right : rect.left - box.left,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const Previous = rtl ? ArrowRight : ArrowLeft;
  const Next = rtl ? ArrowLeft : ArrowRight;
  const format = (value: number) => (rtl ? number(value) : String(value));

  return (
    <div
      className={`product-carousel${overflow ? " has-overflow" : ""} ${className}`}
      role="region"
      aria-roledescription={rtl ? "اسلایدر" : "carousel"}
      aria-label={label}
    >
      <div className="product-carousel-viewport">
        <div ref={trackRef} className="product-carousel-track" onScroll={measure}>
          {products.map((product, index) => (
            <div
              key={product.slug}
              className="product-carousel-slide"
              role="group"
              aria-roledescription={rtl ? "اثر" : "slide"}
              aria-label={`${format(index + 1)} / ${format(products.length)}`}
            >
              <ProductCard product={product} variant={variant} />
            </div>
          ))}
        </div>
        {overflow ? (
          <>
            <button
              type="button"
              className="product-carousel-arrow is-previous"
              onClick={() => goTo(Math.max(active - 1, 0))}
              disabled={active === 0}
              aria-label={c.previous}
            >
              <Previous aria-hidden="true" />
            </button>
            <button
              type="button"
              className="product-carousel-arrow is-next"
              onClick={() => goTo(Math.min(active + 1, products.length - 1))}
              disabled={atEnd}
              aria-label={c.next}
            >
              <Next aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
      {overflow ? (
        <div className="product-carousel-dots">
          {products.map((product, index) => (
            <button
              key={product.slug}
              type="button"
              aria-label={`${c.goTo} ${format(index + 1)}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
