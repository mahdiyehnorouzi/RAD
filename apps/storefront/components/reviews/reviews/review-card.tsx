"use client";

import { Star } from "lucide-react";
import type {Review} from "@rad/types";
import { useLocale } from "@/components/i18n";

export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={16}
          fill={index < rating ? "currentColor" : "none"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const { locale, t } = useLocale();
  return (
    <article className="border border-rad-line bg-rad-paper p-5">
      <header className="mb-2 flex items-center justify-between">
        <b>{review.author}</b>
        <ReviewStars rating={review.rating} />
      </header>
      <p>{review.comment}</p>
      {review.image ? (
        <img src={review.image} alt={t("reviewPhotoAlt")} className="mt-3 max-h-48" />
      ) : null}
      <small className="text-rad-muted">
        {new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
          dateStyle: "medium",
        }).format(review.createdAt)}
      </small>
    </article>
  );
}
