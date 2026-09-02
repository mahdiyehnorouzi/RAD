"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Star, X } from "lucide-react";
import type { Product } from "@/lib/products";
import type { Review } from "@rad/types";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { api } from "@/lib/api";

export function Reviews({ product }: { product: Product }) {
  const { user, addReview } = useCommerce();
  const { locale, t, number } = useLocale();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<string>();
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api<Review[]>(`/products/${product.slug}/reviews`)
      .then(setProductReviews)
      .catch(() => setProductReviews([]));
  }, [product.slug]);

  const average = productReviews.length
    ? productReviews.reduce((sum, review) => sum + review.rating, 0) /
      productReviews.length
    : 0;

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      ![/^image\/jpeg$/, /^image\/png$/, /^image\/webp$/].some((type) =>
        type.test(file.type),
      ) ||
      file.size > 1024 * 1024 ||
      file.size === 0
    ) {
      setError(t("photoError"));
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setFileName(file.name);
      setError("");
    };
    reader.onerror = () => setError(t("photoError"));
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating || comment.trim().length < 3) {
      setError(t("reviewError"));
      commentRef.current?.focus();
      return;
    }
    await addReview({
      productSlug: product.slug,
      author: user!.name,
      rating,
      comment: comment.trim(),
      image,
    });
    setProductReviews(
      await api<Review[]>(`/products/${product.slug}/reviews`).catch(() => []),
    );
    setRating(0);
    setComment("");
    setImage(undefined);
    setFileName("");
    setError("");
  };

  return (
    <PageSection>
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>{t("reviewsEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h2 font-normal">{t("reviewsTitle")}</h2>
        </div>
        {productReviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Star fill="currentColor" aria-hidden="true" />
            <b>
              {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
                maximumFractionDigits: 1,
              }).format(average)}
            </b>
            <span>/ {number(5)}</span>
          </div>
        )}
      </header>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="grid gap-4">
          {productReviews.length ? (
            productReviews.map((review) => (
              <article
                key={review.id}
                className="border border-rad-line bg-rad-paper p-5"
              >
                <header className="mb-2 flex items-center justify-between">
                  <b>{review.author}</b>
                  <span aria-label={`${review.rating} / 5`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        size={16}
                        fill={index < review.rating ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                </header>
                <p>{review.comment}</p>
                {review.image && (
                  <img
                    src={review.image}
                    alt={t("reviewPhotoAlt")}
                    className="mt-3 max-h-48"
                  />
                )}
                <small className="text-rad-muted">
                  {new Intl.DateTimeFormat(
                    locale === "fa" ? "fa-IR" : "en-US",
                    { dateStyle: "medium" },
                  ).format(review.createdAt)}
                </small>
              </article>
            ))
          ) : (
            <p className="text-rad-muted">{t("noReviews")}</p>
          )}
        </div>
        {user ? (
          <form className="grid gap-3" onSubmit={submit} noValidate>
            {error && (
              <p className="text-rad-clay" role="alert">
                {error}
              </p>
            )}
            <fieldset className="border-0 p-0">
              <legend>{t("ratingLabel")}</legend>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => setRating(value)}
                      className="sr-only"
                    />
                    <Star
                      fill={value <= rating ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                    <span className="sr-only">{number(value)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor="review-comment">{t("commentLabel")}</label>
            <textarea
              ref={commentRef}
              id="review-comment"
              rows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t("commentPlaceholder")}
              className="resize-none border-0 border-b border-rad-line bg-transparent outline-none"
            />
            <div>
              <label
                htmlFor="review-photo"
                className="inline-flex items-center gap-2"
              >
                <Camera aria-hidden="true" />
                {t("photoLabel")}
              </label>
              <input
                id="review-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectImage}
                className="mt-2 block"
              />
              <small className="text-rad-muted">{t("photoHelp")}</small>
              {image && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={image}
                    alt={fileName}
                    className="h-16 w-16 object-cover"
                  />
                  <span>{fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(undefined);
                      setFileName("");
                    }}
                    aria-label={t("photoRemove")}
                    className="border-0 bg-transparent"
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            <Button type="submit">{t("submitReview")}</Button>
          </form>
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
