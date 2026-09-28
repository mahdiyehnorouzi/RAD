"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { AboutBalloon } from "./about-balloon";
import { aboutCopy, aboutMedia } from "./const";
import "./about-page.css";

function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line) => (
        <span key={line} className="about-line">
          {line}
        </span>
      ))}
    </>
  );
}

/** Cream → section fill wave (soft arch). */
function WaveUp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 72"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 48C48 18 96 8 160 14C240 22 280 52 340 44C372 40 392 28 400 22V72H0Z" />
    </svg>
  );
}

/** Section fill → cream wave (soft dip). */
function WaveDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 72"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 0H400V28C360 48 310 62 250 56C170 48 130 18 70 24C36 28 12 40 0 48Z" />
    </svg>
  );
}

export function AboutPage() {
  const { locale, href } = useLocale();
  const c = aboutCopy[locale];
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <div className="about-page">
      {/* 1 — hero */}
      <section className="about-hero" aria-labelledby="about-hero-title">
        <figure className="about-hero-media">
          <Image
            src={aboutMedia.hero}
            alt={c.heroAlt}
            fill
            priority
            sizes="(max-width: 720px) 100vw, 420px"
          />
          <svg
            className="about-thread about-thread-hero"
            viewBox="0 0 390 480"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M28 70C86 42 128 96 158 142C198 204 238 230 292 208C334 188 360 130 378 96" />
            <path d="M48 310C96 268 132 318 152 372" opacity="0.7" />
            <path d="M12 420C70 390 120 450 160 490" opacity="0.55" />
          </svg>
          <svg
            className="about-hero-wave"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 72C60 36 120 18 200 28C290 40 340 78 400 96V120H0Z" />
          </svg>
        </figure>
        <div className="about-hero-panel">
          <h1 id="about-hero-title">
            <Lines lines={c.titleLines} />
          </h1>
          <p className="about-lede">
            <Lines lines={c.ledeLines} />
          </p>
          <a className="about-scroll" href="#about-why" aria-label={c.scrollHint}>
            <ArrowDown aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* 2 — why */}
      <section className="about-why" id="about-why" aria-labelledby="about-why-title">
        <div className="about-why-copy">
          <h2 id="about-why-title">{c.whyTitle}</h2>
          <p className="about-why-body">
            <Lines lines={c.whyLines} />
          </p>
          <AboutBalloon />
        </div>
        <div className="about-why-stage">
          <figure className="about-why-media">
            <svg className="about-why-ring" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M48 4C70 2 90 16 96 38C102 62 92 86 68 96C42 106 12 96 4 70C-4 44 10 14 34 6C40 4 44 4 48 4Z" />
            </svg>
            <div className="about-why-frame">
              <Image
                src={aboutMedia.why}
                alt={c.whyAlt}
                fill
                sizes="(max-width: 720px) 88vw, 360px"
              />
            </div>
          </figure>
          <p className="about-hand about-why-caption">
            <Lines lines={c.whyCaptionLines} />
          </p>
        </div>
      </section>

      {/* 3 — founder */}
      <section className="about-founder" aria-labelledby="about-founder-title">
        <WaveUp className="about-wave about-wave-founder-top" />
        <div className="about-founder-band">
          <h2 id="about-founder-title">
            <Lines lines={c.founderTitleLines} />
          </h2>
          <p>
            <Lines lines={c.founderStoryLines} />
          </p>
          <Link className="about-pill about-pill-light" href={href("/contact")}>
            <span>{c.founderCta}</span>
            <ArrowIcon aria-hidden="true" />
          </Link>
        </div>
        <WaveDown className="about-wave about-wave-founder-bottom" />
        <figure className="about-founder-media">
          <Image
            src={aboutMedia.founder}
            alt={c.founderAlt}
            fill
            sizes="(max-width: 720px) 100vw, 420px"
          />
        </figure>
      </section>

      {/* 4 — passage */}
      <section className="about-passage" aria-labelledby="about-passage-title">
        <div className="about-passage-copy">
          <h2 id="about-passage-title">
            <Lines lines={c.passageTitleLines} />
          </h2>
          <p className="about-passage-body">
            <Lines lines={c.passageBodyLines} />
          </p>
        </div>
        <figure className="about-passage-media">
          <svg
            className="about-passage-top-wave"
            viewBox="0 0 400 64"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 0H400V20C340 48 280 60 200 52C110 42 60 18 0 36Z" />
          </svg>
          <Image
            src={aboutMedia.passage}
            alt={c.passageAlt}
            fill
            sizes="(max-width: 720px) 100vw, 420px"
          />
          <svg
            className="about-passage-brush"
            viewBox="0 0 200 120"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M-10 130C20 70 50 40 95 35C130 31 155 55 175 90C185 108 195 125 210 140L-10 140Z" />
          </svg>
        </figure>
      </section>

      {/* 5 — not */}
      <section className="about-not" aria-labelledby="about-not-title">
        <div className="about-not-panel">
          <h2 id="about-not-title">
            <Lines lines={c.isNotLines} />
          </h2>
          <ul>
            {c.notItems.map((item) => (
              <li key={item.lines.join("-")}>
                <span className="about-not-x" aria-hidden="true">
                  ✕
                </span>
                <span className="about-not-text">
                  <Lines lines={item.lines} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <figure className="about-not-media">
          <Image
            src={aboutMedia.not}
            alt={c.notAlt}
            fill
            sizes="(max-width: 720px) 100vw, 420px"
          />
          <svg
            className="about-not-veil"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 0H400V70C320 30 240 10 160 28C80 46 40 90 0 120Z" />
          </svg>
          <svg className="about-roots" viewBox="0 0 200 140" aria-hidden="true">
            <path d="M18 8C42 48 28 78 52 128" />
            <path d="M58 2C72 52 48 88 76 138" />
            <path d="M102 0C94 58 118 92 108 140" />
          </svg>
        </figure>
      </section>

      {/* 6 — find */}
      <section className="about-find" aria-labelledby="about-find-title">
        <h2 id="about-find-title">
          <Lines lines={c.findTitleLines} />
        </h2>
        <p className="about-find-lede">
          <Lines lines={c.findLedeLines} />
        </p>
        <figure className="about-find-media">
          <svg className="about-find-sketch" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="47" />
          </svg>
          <div className="about-find-clay">
            <Image
              src={aboutMedia.stamp}
              alt={c.stampAlt}
              fill
              sizes="(max-width: 720px) 55vw, 220px"
            />
          </div>
        </figure>
        <Link className="about-pill about-pill-solid" href={href("/products")}>
          <span>{c.worksCta}</span>
          <ArrowIcon aria-hidden="true" />
        </Link>
        <hr className="about-rule" />
      </section>

      {/* 7 — custom + once */}
      <section className="about-custom" aria-labelledby="about-custom-title">
        <h2 id="about-custom-title">
          <Lines lines={c.customTitleLines} />
        </h2>
        <p className="about-custom-body">
          <Lines lines={c.customBodyLines} />
        </p>
        <Link className="about-pill about-pill-ghost" href={href("/studio")}>
          <span>{c.customCta}</span>
          <ArrowIcon aria-hidden="true" />
        </Link>
        <hr className="about-rule" />
        <figure className="about-once-media">
          <Image
            src={aboutMedia.once}
            alt={c.onceAlt}
            fill
            sizes="(max-width: 720px) 100vw, 420px"
          />
          <div className="about-once-wave">
            <p className="about-hand about-once-line">
              <Lines lines={c.onceLines} />
            </p>
          </div>
        </figure>
      </section>

      {/* 8 — close */}
      <section className="about-close" aria-labelledby="about-close-title">
        <WaveUp className="about-wave about-wave-close-top" />
        <div className="about-close-inner">
          <h2 id="about-close-title">
            <Lines lines={c.closeTitleLines} />
          </h2>
          <p className="about-close-body">
            <Lines lines={c.closeBodyLines} />
          </p>
          <svg
            className="about-thread about-thread-close"
            viewBox="0 0 360 48"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M6 34C68 10 148 6 218 24C278 40 318 32 352 18" />
          </svg>
        </div>
      </section>
    </div>
  );
}
