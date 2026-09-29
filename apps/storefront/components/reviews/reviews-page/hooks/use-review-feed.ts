import { useCallback, useEffect, useMemo, useState } from "react";
import type { Review } from "@rad/types";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { fetchReviewFeed } from "@/lib/api";
import type { ReviewEntry, ReviewFeedStatus } from "../../type";

/** Every public review, newest first, joined with the work it belongs to. */
export function useReviewFeed() {
  const { getProduct } = useCatalog();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<ReviewFeedStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchReviewFeed()
      .then((payload) => {
        if (cancelled) return;
        setReviews(payload);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  const entries = useMemo<ReviewEntry[]>(
    () => reviews.map((review) => ({ review, product: getProduct(review.productSlug) })),
    [reviews, getProduct],
  );

  return { entries, status, retry };
}
