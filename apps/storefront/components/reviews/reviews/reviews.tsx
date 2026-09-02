"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type {Product} from "@rad/types";
import type {Review} from "@rad/types";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { fetchProductReviews } from "@/lib/api/reviews";
import { ReviewForm } from "./review-form";
import { ReviewList } from "./review-list";

export function Reviews({ product }: { product: Product }) {
  const { user } = useCommerce();
  const { locale, t, number } = useLocale();
  const [productReviews, setProductReviews] = useState<Review[]>([]);

  const loadReviews = async () => {
    const next = await fetchProductReviews(product.slug).catch(() => []);
    setProductReviews(next);
  };

  useEffect(() => {
    void fetchProductReviews(product.slug)
      .then(setProductReviews)
      .catch(() => setProductReviews([]));
  }, [product.slug]);

  const average = productReviews.length
    ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
    : 0;

  return (
    <PageSection>
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>{t("reviewsEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h2 font-normal">{t("reviewsTitle")}</h2>
        </div>
        {productReviews.length > 0 ? (
          <div className="flex items-center gap-2">
            <Star fill="currentColor" aria-hidden="true" />
            <b>
              {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
                maximumFractionDigits: 1,
              }).format(average)}
            </b>
            <span>/ {number(5)}</span>
          </div>
        ) : null}
      </header>
      <div className="grid gap-10 lg:grid-cols-2">
        <ReviewList reviews={productReviews} />
        {user ? (
          <ReviewForm product={product} onSubmitted={loadReviews} />
        ) : (
          <div>
            <p>{t("loginToReview")}</p>
            <ButtonLink href="/account">{t("login")}</ButtonLink>
          </div>
        )}
      </div>
    </PageSection>
  );
}
