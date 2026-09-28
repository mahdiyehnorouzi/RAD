import { useId } from "react";
import type { StateChip } from "../type";

export function StateChips({ title, chips }: { title: string; chips: StateChip[] }) {
  const titleId = useId();
  if (!chips.length) return null;
  return (
    <div className="state-chips" role="group" aria-labelledby={titleId}>
      <p id={titleId} className="state-footer-title">
        {title}
      </p>
      <ul>
        {chips.map((chip) => (
          <li key={chip.id}>
            <button type="button" onClick={chip.onSelect}>
              {chip.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
