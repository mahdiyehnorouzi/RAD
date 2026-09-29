/**
 * Mirrors `Review` in `@rad/types` (the API is CommonJS and cannot import
 * that ESM package).
 */
export interface ReviewView {
  id: string;
  productSlug: string;
  author: string;
  rating: number;
  comment: string;
  image?: string;
  createdAt: number;
}

/** Mirrors `AdminReview` in `@rad/types`. */
export interface AdminReviewView extends ReviewView {
  hidden: boolean;
  productName?: string;
}
