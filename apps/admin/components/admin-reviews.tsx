"use client";

import { useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import type { AdminReview } from "../lib/admin-data";
import { createSingleFlight } from "../lib/admin-mutation";
import { storefrontUrl } from "../lib/storefront-url";
import { AdminAsyncRegion } from "./admin-async-region";
import { ConfirmDialog } from "./admin-dialog";

type Filter = "visible" | "hidden" | "all";

const number = new Intl.NumberFormat("fa-IR");
const dateTime = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
const filters: { id: Filter; label: string }[] = [
  { id: "visible", label: "در فروشگاه" },
  { id: "hidden", label: "پنهان" },
  { id: "all", label: "همه" },
];

/** Customer reviews: hide one from the storefront, or delete it for good. */
export function AdminReviews({
  reviews,
  loading,
  loadError,
  refreshing = false,
  refreshError = false,
  onRetry,
  canWrite,
  onSetHidden,
  onDelete,
}: {
  reviews: AdminReview[];
  loading: boolean;
  loadError: boolean;
  refreshing?: boolean;
  refreshError?: boolean;
  onRetry: () => void;
  canWrite: boolean;
  onSetHidden: (id: string, hidden: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<Filter>("visible");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const hideFlight = useRef(createSingleFlight());
  const counts = useMemo(
    () => ({
      visible: reviews.filter((review) => !review.hidden).length,
      hidden: reviews.filter((review) => review.hidden).length,
      all: reviews.length,
    }),
    [reviews],
  );
  const visible =
    filter === "all"
      ? reviews
      : reviews.filter((review) => review.hidden === (filter === "hidden"));

  const toggle = (review: AdminReview) => {
    void hideFlight.current.run(async () => {
      setBusy(review.id);
      setActionError("");
      try {
        await onSetHidden(review.id, !review.hidden);
      } catch (error) {
        setActionError(
          error instanceof Error && error.message
            ? error.message
            : "تغییر نمایش نظر ناموفق بود. دوباره تلاش کنید.",
        );
      } finally {
        setBusy(null);
      }
    });
  };

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <h2>نظر مشتریان</h2>
          <p>
            نظرهایی که روی صفحه‌ی اثر و صفحه‌ی «نظر مشتریان» دیده می‌شوند. نظر
            پنهان‌شده این‌جا می‌ماند ولی از فروشگاه برداشته می‌شود.
          </p>
        </div>
      </div>

      <div className="message-filters" role="group" aria-label="فیلتر نظرها">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={filter === id ? "active" : ""}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
            <span>
              {loading || loadError ? "…" : number.format(counts[id])}
            </span>
          </button>
        ))}
      </div>

      {actionError ? (
        <p className="admin-inline-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <AdminAsyncRegion
        loading={loading}
        loadError={loadError}
        refreshing={refreshing}
        refreshError={refreshError}
        onRetry={onRetry}
        errorMessage="دریافت نظرها ناموفق بود. اتصال اینترنت را بررسی و دوباره تلاش کنید."
        loadingLabel="در حال بارگذاری نظرها…"
        skeleton="list"
      >
        {visible.length ? (
          <div className="contact-message-list">
            {visible.map((review) => (
              <article
                key={review.id}
                className={`contact-message ${review.hidden ? "is-resolved" : ""}`}
              >
                <header>
                  <div>
                    <strong>{review.author}</strong>
                    <small>
                      <a
                        className="contact-message-reply"
                        href={storefrontUrl(`/products/${review.productSlug}`)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {review.productName ?? review.productSlug}
                      </a>
                      {review.hidden ? " · پنهان از فروشگاه" : ""}
                    </small>
                  </div>
                  <time dateTime={new Date(review.createdAt).toISOString()}>
                    {dateTime(review.createdAt)}
                  </time>
                </header>

                <span
                  className="review-stars"
                  aria-label={`${number.format(review.rating)} از ۵ ستاره`}
                >
                  {"★".repeat(review.rating)}
                  <span aria-hidden="true">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </span>
                <p className="contact-message-body">{review.comment}</p>
                {review.image ? (
                  <img
                    className="review-photo"
                    src={review.image}
                    alt={`عکس ${review.author}`}
                  />
                ) : null}

                {canWrite ? (
                  <footer>
                    <button
                      type="button"
                      className="secondary-action contact-message-toggle"
                      onClick={() => void toggle(review)}
                      disabled={busy === review.id}
                    >
                      {review.hidden ? (
                        <>
                          <Eye aria-hidden="true" /> نمایش در فروشگاه
                        </>
                      ) : (
                        <>
                          <EyeOff aria-hidden="true" /> پنهان کردن
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="secondary-action content-danger"
                      onClick={() => setDeleteTarget(review)}
                      disabled={busy === review.id}
                    >
                      <Trash2 aria-hidden="true" /> حذف
                    </button>
                  </footer>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="contact-message-empty">
            {filter === "hidden"
              ? "نظر پنهانی نیست."
              : "هنوز نظری در این دسته نیست."}
          </p>
        )}
      </AdminAsyncRegion>

      {deleteTarget && (
        <ConfirmDialog
          title={`حذف نظر ${deleteTarget.author}؟`}
          description="نظر برای همیشه حذف می‌شود. اگر فقط نمی‌خواهید در فروشگاه دیده شود، پنهانش کنید."
          confirmLabel="حذف نظر"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </section>
  );
}
