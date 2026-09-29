"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { categoryLabel } from "@/lib/catalog/artwork";
import {
  categoryDefaultImage,
  isFileProductImage,
  productPhotoSrc,
} from "@/lib/catalog/category-defaults";
import { productCopy } from "@/lib/catalog/products";
import { reviewsPageCopy } from "../const";
import type { ReviewEntry } from "../type";

const MAX_RATING = 5;

function workPhoto({ product }: ReviewEntry) {
  if (!product) return null;
  const real = product.images?.find((image) => isFileProductImage(image.src));
  return productPhotoSrc(real?.src) ?? categoryDefaultImage(product.category);
}

export function ReviewCard({ entry }: { entry: ReviewEntry }) {
  const { locale, number, href } = useLocale();
  const c = reviewsPageCopy[locale];
  const { review, product } = entry;
  const work = product ? productCopy(product, locale).name : "";
  const photo = review.image ?? workPhoto(entry);
  const initial = Array.from(review.author.trim())[0] ?? "";
  const date = new Date(review.createdAt);
  const rating = { rating: number(review.rating), max: number(MAX_RATING) };
  const fill = (template: string, vars: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");

  return (
    <article className={`review-entry${photo ? "" : " is-text"}`}>
      <div className="review-entry-body">
        <header className="review-entry-head">
          <span className="review-entry-avatar" aria-hidden="true">
            {initial}
          </span>
          <div className="review-entry-who">
            <h2 dir="auto">{review.author}</h2>
            {product ? (
              <Link href={href(`/products/${product.slug}`)}>{work}</Link>
            ) : null}
          </div>
        </header>

        <ul className="review-entry-tags">
          <li className="is-rating" aria-label={fill(c.ratingLabel, rating)}>
            <Star aria-hidden="true" fill="currentColor" strokeWidth={0} />
            <span aria-hidden="true">{fill(c.rating, rating)}</span>
          </li>
          {product ? <li>{categoryLabel(product.category, locale)}</li> : null}
        </ul>

        <blockquote className="review-entry-quote">
          <svg viewBox="0 0 32 24" aria-hidden="true" focusable="false">
            <path d="M13 2C6.6 3.6 2 8.6 2 15.2 2 19.4 4.6 22 8 22c3 0 5.2-2.2 5.2-5.1 0-2.8-2-4.8-4.6-4.8-.6 0-1.1.1-1.5.2.8-3.3 3.4-6 6.7-7.3L13 2Zm16.6 0c-6.4 1.6-11 6.6-11 13.2 0 4.2 2.6 6.8 6 6.8 3 0 5.2-2.2 5.2-5.1 0-2.8-2-4.8-4.6-4.8-.6 0-1.1.1-1.5.2.8-3.3 3.4-6 6.7-7.3L29.6 2Z" />
          </svg>
          <p dir="auto">{review.comment}</p>
        </blockquote>

        <time className="review-entry-date" dateTime={date.toISOString()}>
          {new Intl.DateTimeFormat(
            locale === "fa" ? "fa-IR" : "en-US",
            locale === "fa"
              ? { day: "numeric", month: "long", year: "numeric" }
              : { dateStyle: "medium" },
          ).format(date)}
        </time>
      </div>

      {photo ? (
        <figure className="review-entry-photo">
          <img
            src={photo}
            alt={review.image ? fill(c.customerPhoto, { author: review.author, work }) : work}
            loading="lazy"
            decoding="async"
          />
        </figure>
      ) : null}
    </article>
  );
}
