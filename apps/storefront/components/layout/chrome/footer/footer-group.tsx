"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * A titled row of footer links. On phones only the first links show and the
 * chevron opens the rest; wider screens list everything.
 */
export function FooterGroup({
  title,
  links,
  more,
  moreLabel,
}: {
  title: string;
  links: ReactNode[];
  more: ReactNode[];
  moreLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const moreId = useId();

  return (
    <section className={`footer-group${open ? " is-open" : ""}`}>
      <h2 className="footer-group-title">
        <span className="footer-group-label">{title}</span>
        {more.length ? (
          <button
            type="button"
            className="footer-group-toggle"
            aria-expanded={open}
            aria-controls={moreId}
            aria-label={moreLabel}
            onClick={() => setOpen((value) => !value)}
          >
            <span>{title}</span>
            <ChevronDown aria-hidden="true" />
          </button>
        ) : null}
      </h2>
      <ul className="footer-group-links">
        {links.map((link, index) => (
          <li key={index}>{link}</li>
        ))}
      </ul>
      {more.length ? (
        <ul className="footer-group-links footer-group-more" id={moreId}>
          {more.map((link, index) => (
            <li key={index}>{link}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
