"use client";

import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton";
import "./product-card.css";

export function ProductGridSkeleton({
  count = 6,
  className = "product-grid",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <SkeletonScreen className={`product-grid-skeleton ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <article className="product-card skeleton-product" key={index}>
          <Skeleton className="skeleton-media" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line short" />
        </article>
      ))}
    </SkeletonScreen>
  );
}
