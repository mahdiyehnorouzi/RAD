"use client";

import { RouteError } from "@/components/ui/route-error";

export default function AppError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  return <RouteError error={error} retry={() => (retry ?? reset)?.()} />;
}
