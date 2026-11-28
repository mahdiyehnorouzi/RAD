import type { ReactNode } from "react";

const number = new Intl.NumberFormat("fa-IR");

export function StatTile({
  icon,
  value,
  label,
  loading = false,
  pressed = false,
  onSelect,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  /** Before the first successful load only — a later background refetch
   * keeps showing the previous number instead of reverting to this. */
  loading?: boolean;
  pressed?: boolean;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <span className="stat-icon">{icon}</span>
      {loading ? (
        <span className="stat-skeleton" aria-hidden="true" />
      ) : (
        <strong>{number.format(value)}</strong>
      )}
      <span>{label}</span>
    </>
  );
  if (!onSelect) return <article className="stat-tile">{body}</article>;
  return (
    <button
      type="button"
      className={`stat-tile${pressed ? " is-active" : ""}`}
      aria-pressed={pressed}
      onClick={onSelect}
    >
      {body}
    </button>
  );
}
