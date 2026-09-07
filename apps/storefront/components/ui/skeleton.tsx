"use client";

import type { CSSProperties, ReactNode } from "react";
import { useLocale } from "@/components/i18n";
import "./skeleton.css";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonScreen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <div
      className={`skeleton-screen ${className}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{t("loading")}</span>
      {children}
    </div>
  );
}

export function CardListSkeleton({
  count = 3,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <SkeletonScreen className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <Skeleton className="skeleton-line short" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line short" />
        </div>
      ))}
    </SkeletonScreen>
  );
}
