"use client";

import { getImageProps } from "next/image";
import { useLocale } from "@/components/i18n";
import { contactMedia, contactPageCopy, contactTears } from "../const";
import { ContactTear } from "./contact-tear";

function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line) => (
        <span key={line} className="contact-line">
          {line}
        </span>
      ))}
    </>
  );
}

export function ContactHero() {
  const { locale } = useLocale();
  const c = contactPageCopy[locale];
  const common = { alt: c.heroAlt, fetchPriority: "high" as const };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, ...contactMedia.heroWide, sizes: "min(100vw, 76rem)" });
  const {
    props: { srcSet: tall, ...img },
  } = getImageProps({ ...common, ...contactMedia.hero, sizes: "100vw" });

  return (
    <section className="contact-hero" aria-labelledby="contact-title">
      <picture className="contact-hero-media">
        <source media="(min-width: 960px)" srcSet={wide} sizes="min(100vw, 76rem)" />
        <img {...img} srcSet={tall} alt={c.heroAlt} loading="eager" />
      </picture>

      <svg
        className="contact-thread contact-hero-threads is-tall"
        viewBox="0 0 400 533"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path pathLength={1} d="M176 -4C160 30 104 34 70 70C36 106 50 160 28 196C16 214 2 222 -8 224" />
        <path pathLength={1} d="M408 180C382 176 366 196 372 226C378 256 362 280 348 302" />
      </svg>
      <svg
        className="contact-thread contact-hero-threads is-wide"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          pathLength={1}
          d="M1020 -6C1000 50 930 64 900 110C872 154 910 196 870 236C840 266 780 262 760 300C744 332 770 380 740 420C716 452 660 470 640 560"
        />
      </svg>

      <div className="contact-hero-copy">
        <h1 id="contact-title">
          <Lines lines={c.titleLines} />
        </h1>
        <p className="contact-lede">
          <Lines lines={c.ledeLines} />
        </p>
      </div>

      <ContactTear shape={contactTears.hero} className="contact-hero-tear" />
    </section>
  );
}
