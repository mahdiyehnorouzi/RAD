import type { Review } from "@rad/types";
import { api } from "./client";

export async function fetchProductReviews(slug: string) {
  return api<Review[]>(`/products/${slug}/reviews`);
}

export async function fetchReviewFeed() {
  return api<Review[]>("/reviews");
}
