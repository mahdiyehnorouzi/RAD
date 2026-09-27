"use client";

import { RouteError } from "@/components/ui/route-error";

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
    <RouteError
      error={error}
      retry={() => (retry ?? reset)?.()}
      title="productErrorTitle"
      body="productErrorBody"
      backHref="/products"
      backLabel="viewWorks"
    />
  );
}
