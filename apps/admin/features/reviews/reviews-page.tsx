"use client";

import { useAdminChrome } from "../../components/admin-shell";
import { AdminReviews } from "./admin-reviews";

export function ReviewsPage() {
  const { workspace, announce } = useAdminChrome();
  const loading =
    !workspace.loadedKeys.has("reviews") &&
    !workspace.loadErrors.has("reviews");
  return (
    <AdminReviews
      reviews={workspace.reviews}
      loading={loading}
      loadError={workspace.loadErrors.has("reviews")}
      refreshing={workspace.refreshingKeys.has("reviews")}
      refreshError={workspace.refreshErrors.has("reviews")}
      onRetry={() => {
        void workspace.retryResource("reviews");
      }}
      canWrite={workspace.can("content.write")}
      onSetHidden={async (id, hidden) => {
        await workspace.setReviewHidden(id, hidden);
        announce(
          hidden
            ? "نظر از فروشگاه پنهان شد."
            : "نظر دوباره در فروشگاه دیده می‌شود.",
        );
      }}
      onDelete={async (id) => {
        await workspace.deleteReview(id);
        announce("نظر حذف شد.");
      }}
    />
  );
}
