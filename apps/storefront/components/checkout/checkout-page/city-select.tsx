"use client";

import { useMemo, useRef, useState } from "react";
import { IRAN_CITIES } from "@/lib/geo/iran-cities";
import "./city-select.css";

const MAX_SUGGESTIONS = 8;

export function CitySelect({
  id,
  name,
  defaultValue = "",
  disabled,
  invalid,
  describedBy,
  onChangeValue,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChangeValue?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = `${id}-listbox`;

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return IRAN_CITIES.slice(0, MAX_SUGGESTIONS);
    return IRAN_CITIES.filter((city) => city.includes(q)).slice(
      0,
      MAX_SUGGESTIONS,
    );
  }, [query]);

  const commit = (city: string) => {
    if (inputRef.current) inputRef.current.value = city;
    setQuery(city);
    setOpen(false);
    setActiveIndex(-1);
    onChangeValue?.();
  };

  return (
    <div className="city-select" data-open={open ? "" : undefined}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        autoComplete="address-level2"
        defaultValue={defaultValue}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onInput={(event) => {
          setQuery(event.currentTarget.value);
          setOpen(true);
          setActiveIndex(-1);
          onChangeValue?.();
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) =>
              Math.min(index + 1, filtered.length - 1),
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter") {
            if (open && activeIndex >= 0 && filtered[activeIndex]) {
              event.preventDefault();
              commit(filtered[activeIndex]);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && filtered.length > 0 ? (
        <ul className="city-select-list" id={listboxId} role="listbox">
          {filtered.map((city, index) => (
            <li
              key={city}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "is-active" : undefined}
              onMouseDown={(event) => {
                event.preventDefault();
                commit(city);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
