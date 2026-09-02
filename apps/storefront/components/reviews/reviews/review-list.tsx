"use client";

import type {Review} from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ReviewCard } from "./review-card";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const { t } = useLocale();
  if (!reviews.length) return <p className="text-rad-muted">{t("noReviews")}</p>;
  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
