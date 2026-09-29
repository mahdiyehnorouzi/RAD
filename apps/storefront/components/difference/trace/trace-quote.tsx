import "./trace.css";

import Image from "next/image";
import { differenceMedia, traceTears } from "../const";
import { TraceTear } from "./trace-tear";

/** The closing line, hand-lettered on a paper slip beside a block of raw clay. */
export function TraceQuote({ lines }: { lines: readonly string[] }) {
  return (
    <div className="trace-quote">
      <p className="trace-quote-text">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <svg className="trace-quote-pen" viewBox="0 0 140 14" aria-hidden="true" focusable="false">
        <path pathLength={1} d="M3 9C22 5 46 4 70 7C92 10 114 10 137 5" />
      </svg>
      <div className="trace-quote-media" aria-hidden="true">
        <Image src={differenceMedia.quote} alt="" fill sizes="(min-width: 960px) 16rem, 34vw" />
        <TraceTear shape={traceTears.side} className="trace-quote-tear" />
      </div>
    </div>
  );
}
