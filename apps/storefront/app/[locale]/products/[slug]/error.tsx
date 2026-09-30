"use client";

import { ErrorState } from "@/components/states";

export default function ProductError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  return (
    <ErrorState
      error={error}
      onRetry={() => (retry ?? reset)?.()}
      title="productErrorTitle"
      body="productErrorBody"
      back={{ href: "/products", label: "viewWorks" }}
    />
  );
}
