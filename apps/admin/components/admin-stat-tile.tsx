import type { ReactNode } from "react";

const number = new Intl.NumberFormat("fa-IR");

export function StatTile({
  icon,
  value,
  label,
  loading = false,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  /** Before the first successful load only — a later background refetch
   * keeps showing the previous number instead of reverting to this. */
  loading?: boolean;
}) {
  return (
    <article className="stat-tile">
      <span className="stat-icon">{icon}</span>
      {loading ? (
        <span className="stat-skeleton" aria-hidden="true" />
      ) : (
        <strong>{number.format(value)}</strong>
      )}
      <span>{label}</span>
    </article>
  );
}
