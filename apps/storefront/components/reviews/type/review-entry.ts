import type { Product, Review } from "@rad/types";

/** A customer review joined with the work it was left on, when that work is still listed. */
export type ReviewEntry = {
  review: Review;
  product?: Product;
};

export type ReviewFeedStatus = "loading" | "ready" | "error";
