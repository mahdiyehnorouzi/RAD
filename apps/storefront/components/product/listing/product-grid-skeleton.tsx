import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton";
import "./product-grid.css";

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
        <article className="skeleton-product" key={index}>
          <Skeleton className="skeleton-media" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line short" />
        </article>
      ))}
    </SkeletonScreen>
  );
}
