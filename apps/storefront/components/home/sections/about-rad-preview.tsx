"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { homeMedia } from "../const";
import { useInView } from "../hooks";
import "../motion/reveal.css";
import "./about-rad-preview.css";

const copy = {
  fa: {
    title: "رَد چیست؟",
    statement: "چیزی که بعد از دست، ماده و اتفاق باقی می‌ماند.",
    paragraphs: [
      "رَد برای ساختن چیزهایی شکل گرفت که قرار نیست دقیقاً تکرار شوند.",
      "اینجا یک ایده ممکن است از یک عکس، یک خاطره، یک فرم عجیب یا حتی چیزی که اتفاقی دیده‌ای شروع شود؛ بعد بین دست، ماده و آدمی که آن را می‌سازد تغییر کند.",
    ],
    link: "داستان رَد",
    alt: "دستی که فرمی ناتمام را از روی رد دایره‌ای آن در غبار خاک رس بلند می‌کند",
    note: ["اثر دست", "ماده", "اتفاق"],
  },
  en: {
    title: "What is RAD?",
    statement: "What remains after the hand, the material, and chance.",
    paragraphs: [
      "RAD was formed to make things that are not meant to be repeated exactly.",
      "An idea may begin with a photograph, a memory, an unusual form, or something seen by chance; then it changes between the hand, the material, and the person making it.",
    ],
    link: "The RAD story",
    alt: "A hand lifting an unfinished form from its circular trace in clay dust",
    note: ["HAND", "MATERIAL", "CHANCE"],
  },
} as const;

export function AboutRadPreview() {
  const { locale } = useLocale();
  const c = copy[locale];
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.18 });

  return (
    <section
      ref={ref}
      className={`section about-rad-preview home-reveal${inView ? " is-visible" : ""}`}
      aria-labelledby="about-rad-preview-title"
    >
      <figure
        className="about-rad-preview-visual reveal-item"
        data-reveal="media"
      >
        <Image
          src={homeMedia.aboutRadTrace}
          alt={c.alt}
          fill
          sizes="(max-width: 760px) 100vw, 64vw"
        />
        <figcaption aria-label={c.note.join(" / ")}>
          {c.note.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </figcaption>
      </figure>
      <div className="about-rad-preview-copy">
        <h2
          id="about-rad-preview-title"
          className="reveal-item"
          data-reveal="heading"
        >
          {c.title}
        </h2>
        <div className="reveal-item" data-reveal="body">
          <p className="about-rad-preview-statement">{c.statement}</p>
          {c.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="reveal-item" data-reveal="cta">
          <ButtonLink href="/about" outline>
            {c.link}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
