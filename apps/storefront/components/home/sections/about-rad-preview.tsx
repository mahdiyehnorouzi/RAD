"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { useInView } from "../hooks";
import "../motion/reveal.css";
import "./about-rad-preview.css";

const copy = {
  fa: {
    title: "رَد چیست؟",
    paragraphs: [
      "رَد برای ساختن چیزهایی شکل گرفت که قرار نیست دقیقاً تکرار شوند.",
      "اینجا یک ایده ممکن است از یک عکس، یک خاطره، یک فرم عجیب یا حتی چیزی که اتفاقی دیده‌ای شروع شود؛ بعد بین دست، ماده و آدمی که آن را می‌سازد تغییر کند.",
      "برای همین هر رَد فقط یک‌بار ساخته می‌شود. هیچ دو رَدی یکی نیست.",
    ],
    link: "داستان رَد",
    alt: "یک شیء دست‌ساز رَد در نور طبیعی",
    note: "اثر دست / ماده / اتفاق",
  },
  en: {
    title: "What is RAD?",
    paragraphs: [
      "RAD was formed to make things that are not meant to be repeated exactly.",
      "An idea may begin with a photograph, a memory, an unusual form, or something seen by chance; then it changes between the hand, the material, and the person making it.",
      "That is why every RAD is made only once. No two RADs are the same.",
    ],
    link: "The RAD story",
    alt: "A handmade RAD object in natural light",
    note: "HAND / MATERIAL / CHANCE",
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
          src="/home/entry-ready-v2.jpg"
          alt={c.alt}
          fill
          sizes="(max-width: 760px) 100vw, 58vw"
        />
        <figcaption>{c.note}</figcaption>
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
