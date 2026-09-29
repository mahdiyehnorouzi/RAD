"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";

/** Move, edit and delete controls for one item of an ordered content list. */
export function AdminRowActions({
  label,
  index,
  total,
  disabled,
  onMove,
  onEdit,
  onDelete,
}: {
  /** Names the item in each button's accessible label. */
  label: string;
  index: number;
  total: number;
  disabled?: boolean;
  onMove: (from: number, to: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <footer className="content-row-actions">
      <button
        type="button"
        className="secondary-action"
        onClick={() => onMove(index, index - 1)}
        disabled={disabled || index === 0}
        aria-label={`بالا بردن ${label}`}
      >
        <ArrowUp aria-hidden="true" />
      </button>
      <button
        type="button"
        className="secondary-action"
        onClick={() => onMove(index, index + 1)}
        disabled={disabled || index === total - 1}
        aria-label={`پایین بردن ${label}`}
      >
        <ArrowDown aria-hidden="true" />
      </button>
      <button type="button" className="secondary-action" onClick={onEdit} disabled={disabled}>
        <Pencil aria-hidden="true" /> ویرایش
      </button>
      <button
        type="button"
        className="secondary-action content-danger"
        onClick={onDelete}
        disabled={disabled}
      >
        <Trash2 aria-hidden="true" /> حذف
      </button>
    </footer>
  );
}

/** The ids in their new order after moving one item from `from` to `to`. */
export function movedIds(items: { id: string }[], from: number, to: number) {
  const ids = items.map((item) => item.id);
  const [moved] = ids.splice(from, 1);
  ids.splice(to, 0, moved);
  return ids;
}
