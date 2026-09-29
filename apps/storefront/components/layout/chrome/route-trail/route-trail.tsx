"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { useLocale } from "@/components/i18n";
import { trailCopy } from "./const";
import { useRouteTrail } from "./hooks";
import "./route-trail.css";

export function RouteTrail() {
  const { locale, href } = useLocale();
  const { crumbs, hidden, pathname } = useRouteTrail();
  const listRef = useRef<HTMLOListElement>(null);
  const c = trailCopy[locale];
  const rtl = locale === "fa";
  const trailKey = crumbs.map((crumb) => crumb.label).join("|");

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const fit = () => {
      const overflowing = list.scrollWidth > list.clientWidth + 1;
      list.dataset.overflow = String(overflowing);
      if (overflowing) list.scrollLeft = rtl ? -list.scrollWidth : list.scrollWidth;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [trailKey, rtl, hidden]);

  if (hidden) return null;

  return (
    <nav className="route-trail" aria-label={c.aria} dir={rtl ? "rtl" : "ltr"}>
      <ol ref={listRef} className="route-trail-list" key={pathname}>
        {crumbs.map((crumb, index) => (
          <li
            key={`${index}-${crumb.path ?? "current"}`}
            style={{ "--i": index } as CSSProperties}
          >
            {crumb.path ? (
              <Link className="route-trail-link" href={href(crumb.path)}>
                <bdi>{crumb.label}</bdi>
              </Link>
            ) : (
              <span
                className="route-trail-current"
                aria-current="page"
                title={crumb.label}
              >
                <bdi>{crumb.label}</bdi>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
