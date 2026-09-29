import type { Review } from "../database/entities";
import type { AdminReviewView, ReviewView } from "./type";

export function toReview(review: Review): ReviewView {
  return {
    id: review.id,
    productSlug: review.productSlug,
    author: review.author,
    rating: review.rating,
    comment: review.comment,
    image: review.image ?? undefined,
    createdAt: review.createdAt.getTime(),
  };
}

export function toAdminReview(review: Review): AdminReviewView {
  return {
    ...toReview(review),
    hidden: review.hidden,
    productName: review.product?.name,
  };
}
