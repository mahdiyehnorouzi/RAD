"use client";

import { useMemo, useState } from "react";
import { RotateCw } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { StateScreen } from "@/components/states";
import { ButtonLink } from "@/components/ui/button-link";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { categoryLabel } from "@/lib/catalog/artwork";
import { reviewsPageCopy } from "../const";
import { useReviewFeed } from "./hooks";
import { ReviewCard } from "./review-card";
import "./reviews-page.css";

const ALL = "all";

export function ReviewsPage() {
  const { locale } = useLocale();
  const c = reviewsPageCopy[locale];
  const { entries, status, retry } = useReviewFeed();
  const [filter, setFilter] = useState(ALL);

  const categories = useMemo<string[]>(
    () => [
      ...new Set(
        entries.flatMap((entry) => (entry.product ? [entry.product.category] : [])),
      ),
    ],
    [entries],
  );
  const active = categories.includes(filter) ? filter : ALL;
  const visible =
    active === ALL
      ? entries
      : entries.filter((entry) => entry.product?.category === active);

  return (
    <section className="reviews-page" aria-labelledby="reviews-title">
      <header className="reviews-page-head">
        <h1 id="reviews-title">{c.title}</h1>
        <p>{c.lede}</p>
      </header>

      {status === "ready" && categories.length > 1 ? (
        <div className="reviews-page-filters" role="group" aria-label={c.filters}>
          {[ALL, ...categories].map((id) => (
            <button
              key={id}
              type="button"
              className="reviews-chip"
              aria-pressed={active === id}
              onClick={() => setFilter(id)}
            >
              {id === ALL ? c.all : categoryLabel(id, locale)}
            </button>
          ))}
        </div>
      ) : null}

      {status === "loading" ? (
        <CardListSkeleton count={3} className="reviews-page-list" />
      ) : status === "error" ? (
        <StateScreen
          art="error"
          tone="error"
          title={c.errorTitle}
          body={<p>{c.errorBody}</p>}
          actions={
            <button type="button" className="button" onClick={retry}>
              <span>{c.retry}</span>
              <RotateCw className="state-screen-icon" aria-hidden="true" />
            </button>
          }
        />
      ) : visible.length ? (
        <ol className="reviews-page-list">
          {visible.map((entry) => (
            <li key={entry.review.id}>
              <ReviewCard entry={entry} />
            </li>
          ))}
        </ol>
      ) : (
        <StateScreen
          art="empty-favorites"
          title={c.emptyTitle}
          body={<p>{c.emptyBody}</p>}
          actions={<ButtonLink href="/products">{c.emptyCta}</ButtonLink>}
        />
      )}

      <div className="reviews-page-cta">
        <ButtonLink href="/studio">{c.cta}</ButtonLink>
      </div>
    </section>
  );
}
