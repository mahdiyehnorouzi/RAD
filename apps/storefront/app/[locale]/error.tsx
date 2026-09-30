"use client";

import { ErrorState } from "@/components/states";

export default function AppError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  return <ErrorState error={error} onRetry={() => (retry ?? reset)?.()} />;
}
