import type { Review } from "../database/entities";
import type { ReviewView } from "./type";

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
