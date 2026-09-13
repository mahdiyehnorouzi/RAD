"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { aboutCopy, aboutMedia } from "./const";
import "./about-page.css";

export function AboutPage() {
  const { locale } = useLocale();
  const c = aboutCopy[locale];

  return (
    <div className="about-page">
      <section className="about-opening section">
        <h1>{c.title}</h1>
        <p className="about-opening-lede">{c.lede}</p>
        <figure className="about-opening-visual">
          <Image
            src={aboutMedia.workbench}
            alt={c.openingAlt}
            fill
            priority
            sizes="100vw"
          />
        </figure>
      </section>

      <section className="about-why section">
        <div className="about-why-copy">
          <h2>{c.whyTitle}</h2>
          {c.why.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <figure className="about-why-visual">
          <Image
            src={aboutMedia.intermediate}
            alt={c.whyAlt}
            fill
            sizes="(max-width: 760px) 100vw, 58vw"
          />
        </figure>
      </section>

      <section className="about-founder section">
        <figure>
          <video
            controls
            disablePictureInPicture
            loop
            muted
            playsInline
            poster="/about/about-workbench.webp"
            preload="metadata"
            aria-label={c.founderAlt}
          >
            <source src="/about/about-process-live.mp4" type="video/mp4" />
          </video>
        </figure>
        <div>
          <h2>{c.founderTitle}</h2>
          <p className="about-founder-lead">{c.founderLead}</p>
          <p>{c.founderStory}</p>
          <p>{c.founderClose}</p>
        </div>
      </section>

      <section className="about-name section">
        <h2>{c.nameLine}</h2>
        <figure>
          <Image
            src={aboutMedia.trace}
            alt={c.traceAlt}
            fill
            sizes="(max-width: 760px) 88vw, 48vw"
          />
        </figure>
      </section>

      <section
        className="about-contrast section"
        aria-label={`${c.isNot} ${c.is}`}
      >
        <div className="about-contrast-column is-not">
          <h2>{c.isNot}</h2>
          <ul>
            {c.notItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="about-contrast-column is-rad">
          <h2>{c.is}</h2>
          <ul>
            {c.isItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="about-final section">
        <h2>{c.finalTitle}</h2>
        <div className="about-final-paths">
          <article>
            <h3>{c.worksTitle}</h3>
            <p>{c.worksBody}</p>
            <ButtonLink href="/products" outline>
              {c.worksCta}
            </ButtonLink>
          </article>
          <article>
            <h3>{c.customTitle}</h3>
            <p>{c.customBody}</p>
            <ButtonLink href="/studio">{c.customCta}</ButtonLink>
          </article>
        </div>
      </section>
    </div>
  );
}
