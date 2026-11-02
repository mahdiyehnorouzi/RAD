"use client";

const skeletonCount = { list: 3, table: 5, rows: 3 } as const;

/**
 * Initial load, initial failure, and a later refresh are different states.
 * A refresh never replaces the list with a skeleton or an empty state.
 */
export function AdminAsyncRegion({
  loading,
  loadError,
  refreshing = false,
  refreshError = false,
  onRetry,
  errorMessage,
  loadingLabel,
  skeleton = "list",
  children,
}: {
  loading: boolean;
  loadError: boolean;
  refreshing?: boolean;
  refreshError?: boolean;
  onRetry: () => void;
  errorMessage: string;
  loadingLabel: string;
  skeleton?: keyof typeof skeletonCount;
  children?: React.ReactNode;
}) {
  return (
    <>
      {!loadError && refreshing ? (
        <p className="admin-refresh" role="status">
          در حال به‌روزرسانی…
        </p>
      ) : null}
      {!loadError && refreshError ? (
        <div className="admin-refresh-error" role="alert">
          <p>به‌روزرسانی ناموفق بود. اطلاعات قبلی هنوز نمایش داده می‌شود.</p>
          <button className="secondary-action" type="button" onClick={onRetry}>
            تلاش دوباره
          </button>
        </div>
      ) : null}
      {loadError ? (
        <div className="admin-section-error" role="alert">
          <p>{errorMessage}</p>
          <button className="primary-action" type="button" onClick={onRetry}>
            تلاش دوباره
          </button>
        </div>
      ) : loading ? (
        <div
          className="admin-skeleton"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="admin-loading">{loadingLabel}</p>
          {Array.from({ length: skeletonCount[skeleton] }, (_, index) => (
            <span
              key={index}
              className={`admin-skeleton-block ${skeleton}`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
        children
      )}
    </>
  );
}
