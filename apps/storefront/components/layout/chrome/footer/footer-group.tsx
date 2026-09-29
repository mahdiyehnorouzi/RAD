import type { ReactNode } from "react";

/** A titled column of footer links, all of them visible at every width. */
export function FooterGroup({ title, links }: { title: string; links: ReactNode[] }) {
  return (
    <section className="footer-group">
      <h2 className="footer-group-title">{title}</h2>
      <ul className="footer-group-links">
        {links.map((link, index) => (
          <li key={index}>{link}</li>
        ))}
      </ul>
    </section>
  );
}
