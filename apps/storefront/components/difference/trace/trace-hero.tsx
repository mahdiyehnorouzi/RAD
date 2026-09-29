import "./trace.css";

import Image from "next/image";
import { traceTears } from "../const";
import { TraceTear } from "./trace-tear";

/** Title, a looped oxide underline, and a still life that bleeds off the reading end and tears into the page. */
export function TraceHero({
  titleId,
  title,
  lede,
  image,
  swatch,
  mirrored = false,
  children,
}: {
  titleId: string;
  title: string;
  lede: string;
  image?: { src: string; alt: string };
  swatch?: { color: string; accent: string };
  /** Flip the photo in LTR so the subject stays at the reading end; never for a real work's record photo. */
  mirrored?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className={`trace-hero ${mirrored ? "is-mirrored" : ""}`} aria-labelledby={titleId}>
      <div className="trace-hero-copy">
        <h1 id={titleId}>{title}</h1>
        <svg
          className="trace-hero-loop"
          viewBox="0 0 320 44"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            pathLength={1}
            d="M318 14C288 30 250 34 214 28C196 25 184 16 190 9C196 3 208 8 204 19C198 34 168 38 132 34C94 30 50 30 2 40"
          />
        </svg>
        <p className="trace-hero-lede">{lede}</p>
        {children}
      </div>

      <div className="trace-hero-media">
        {image ? (
          <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 960px) 58vw, 100vw" />
        ) : swatch ? (
          <span
            className="trace-step-swatch"
            style={
              {
                "--swatch": swatch.color,
                "--swatch-accent": swatch.accent,
              } as React.CSSProperties
            }
          />
        ) : null}
        <svg
          className="trace-hero-thread"
          viewBox="0 0 400 300"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path pathLength={1} d="M352 -6C378 40 380 92 356 130C334 166 340 212 370 240C388 258 396 282 392 310" />
        </svg>
        <TraceTear shape={traceTears.hero} className="trace-hero-tear" />
      </div>
    </section>
  );
}
