import type {Review} from "@rad/types";
import { api } from "./client";

export async function fetchProductReviews(slug: string) {
  return api<Review[]>(`/products/${slug}/reviews`);
}

export async function createProductReview(
  slug: string,
  input: { rating: number; comment: string; image?: string },
) {
  return api<Review>(`/products/${slug}/reviews`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
