"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Camera, Star, X } from "lucide-react";
import type {Product} from "@rad/types";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { Button } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";

export function ReviewForm({
  product,
  onSubmitted,
}: {
  product: Product;
  onSubmitted: () => Promise<void>;
}) {
  const { user, addReview } = useCommerce();
  const { t, number } = useLocale();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<string>();
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      ![/^image\/jpeg$/, /^image\/png$/, /^image\/webp$/].some((type) => type.test(file.type)) ||
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
    await onSubmitted();
    setRating(0);
    setComment("");
    setImage(undefined);
    setFileName("");
    setError("");
  };

  return (
    <form className="grid gap-3" onSubmit={submit} noValidate>
      {error ? (
        <p className="text-rad-clay" role="alert">
          {error}
        </p>
      ) : null}
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
              <Star fill={value <= rating ? "currentColor" : "none"} aria-hidden="true" />
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
        <label htmlFor="review-photo" className="inline-flex items-center gap-2">
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
        {image ? (
          <div className="mt-3 flex items-center gap-3">
            <img src={image} alt={fileName} className="h-16 w-16 object-cover" />
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
        ) : null}
      </div>
      <Button type="submit">{t("submitReview")}</Button>
    </form>
  );
}
