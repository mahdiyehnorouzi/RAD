"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Star, X } from "lucide-react";
import type { Product } from "@/lib/products";
import type { Review } from "@rad/types";
import { useCommerce } from "./commerce";
import { useLocale } from "./i18n";
import { api } from "@/lib/api";

export function Reviews({ product }: { product: Product }) {
  const { user, addReview } = useCommerce();
  const { locale, t, href, number } = useLocale();
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
    <section className="reviews section">
      <header className="reviews-heading">
        <div>
          <span className="eyebrow">{t("reviewsEyebrow")}</span>
          <h2>{t("reviewsTitle")}</h2>
        </div>
        {productReviews.length > 0 && (
          <div className="review-average">
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
      <div className="reviews-grid">
        <div className="review-list">
          {productReviews.length ? (
            productReviews.map((review) => (
              <article key={review.id} className="review-card">
                <header>
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
                  <img src={review.image} alt={t("reviewPhotoAlt")} />
                )}
                <small>
                  {new Intl.DateTimeFormat(
                    locale === "fa" ? "fa-IR" : "en-US",
                    { dateStyle: "medium" },
                  ).format(review.createdAt)}
                </small>
              </article>
            ))
          ) : (
            <div className="review-empty">
              <p>{t("noReviews")}</p>
            </div>
          )}
        </div>
        {user ? (
          <form className="review-form" onSubmit={submit} noValidate>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <fieldset>
              <legend>{t("ratingLabel")}</legend>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => setRating(value)}
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
            />
            <div className="review-upload">
              <label htmlFor="review-photo">
                <Camera aria-hidden="true" />
                {t("photoLabel")}
              </label>
              <input
                id="review-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectImage}
              />
              <small>{t("photoHelp")}</small>
              {image && (
                <div className="review-preview">
                  <img src={image} alt={fileName} />
                  <span>{fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(undefined);
                      setFileName("");
                    }}
                    aria-label={t("photoRemove")}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            <button className="button" type="submit">
              {t("submitReview")}
            </button>
          </form>
        ) : (
          <div className="review-login">
            <p>{t("loginToReview")}</p>
            <Link className="button" href={href("/account")}>
              {t("login")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
