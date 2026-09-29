"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { differenceMedia, differencePageCopy, traceTears } from "../const";
import { TraceTear } from "../trace";

const order = ["hand", "material", "idea"] as const;

export function DifferencesTraces() {
  const { locale } = useLocale();
  const c = differencePageCopy[locale];

  return (
    <section className="differences-traces" aria-labelledby="differences-traces-title">
      <h2 id="differences-traces-title" className="trace-sr">
        {c.tracesTitle}
      </h2>
      {order.map((id) => {
        const trace = c.traces[id];
        return (
          <article className="differences-trace" key={id}>
            <h3>{trace.title}</h3>
            <p>{trace.body}</p>
            <figure className="differences-trace-media">
              <span className="differences-trace-photo">
                <Image
                  src={differenceMedia.traces[id]}
                  alt={trace.alt}
                  fill
                  sizes="(min-width: 960px) 24rem, 100vw"
                />
                <TraceTear shape={traceTears.band} className="differences-trace-tear" />
              </span>
              <figcaption className="differences-trace-note">
                {trace.note.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </figcaption>
            </figure>
          </article>
        );
      })}
    </section>
  );
}
