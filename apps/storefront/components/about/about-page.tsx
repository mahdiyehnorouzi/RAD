"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, X } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { AboutBalloon } from "./about-balloon";
import { aboutCopy, aboutMedia } from "./const";
import { usePlayInView, useRevealOnce } from "./hooks";
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

/** Organic photo frames, in object-bounding-box units so they scale with the figure. */
function AboutClips() {
  return (
    <svg className="about-clips" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="about-clip-why" clipPathUnits="objectBoundingBox">
          <path d="M.03 .34C.1 .2 .26 .12 .44 .08C.62 .04 .82 .03 .94 .1C1.02 .16 1 .34 1 .5C1 .7 .98 .86 .86 .94C.72 1.02 .46 1 .26 .96C.1 .93 0 .84 0 .68C0 .54 -.01 .42 .03 .34Z" />
        </clipPath>
        <clipPath id="about-clip-passage" clipPathUnits="objectBoundingBox">
          <path d="M0 0H.8C.88 0 .95 .02 1 .07V.8C.9 .83 .8 .87 .66 .91C.46 .97 .22 1 0 1Z" />
        </clipPath>
        <clipPath id="about-clip-not" clipPathUnits="objectBoundingBox">
          <path d="M0 .2C.02 .08 .12 0 .28 0C.44 0 .56 .08 .62 .18C.66 .24 .72 .26 .82 .26C.92 .26 1 .3 1 .38V.86C.94 .96 .8 1 .6 1C.34 1 .1 .9 .03 .72C0 .64 0 .4 0 .2Z" />
        </clipPath>
        <clipPath id="about-clip-once" clipPathUnits="objectBoundingBox">
          <path d="M0 0H1V.95C.84 .93 .62 .94 .42 .96C.26 .98 .12 .99 0 1Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function AboutPage() {
  const { locale, href } = useLocale();
  const c = aboutCopy[locale];
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;
  const pageRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  useRevealOnce(pageRef);
  usePlayInView(filmRef);

  return (
    <div className="about-page" ref={pageRef}>
      <AboutClips />

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
            className="about-hero-edge"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M0 120V112C70 108 150 92 230 62C300 36 350 22 400 18V120Z" />
          </svg>
        </figure>
        <svg
          className="about-thread about-thread-hero"
          viewBox="0 0 400 620"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path pathLength={1} d="M100 0C108 56 92 110 108 170C118 212 114 246 120 276" />
          <path pathLength={1} d="M312 36C322 100 298 160 316 220C324 250 326 276 324 296" />
          <path pathLength={1} d="M-6 612C10 560 22 520 30 478C40 430 50 404 74 392" />
        </svg>
        <div className="about-hero-copy">
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

      <section className="about-why" id="about-why" aria-labelledby="about-why-title">
        <svg
          className="about-why-wash"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 0H400V8C370 4 320 6 260 18C180 34 90 50 0 44Z" />
        </svg>
        <div className="about-why-copy">
          <h2 id="about-why-title">
            <Lines lines={c.whyTitleLines} />
          </h2>
          <p>
            <Lines lines={c.whyLines} />
          </p>
        </div>
        <figure className="about-why-media" data-reveal>
          <AboutBalloon />
          <div className="about-why-frame">
            <Image
              src={aboutMedia.why}
              alt={c.whyAlt}
              fill
              sizes="(max-width: 720px) 100vw, 420px"
            />
          </div>
          <svg
            className="about-thread about-why-thread"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path pathLength={1} d="M-2 40C6 22 24 12 44 7C62 3 82 1 95 8C103 13 102 30 101 46" />
            <path pathLength={1} d="M2 30C24 26 50 18 74 8C84 4 92 2 99 3" opacity="0.7" />
            <path pathLength={1} d="M-2 84C14 98 42 101 64 99C80 97 94 93 102 86" />
          </svg>
        </figure>
        <div className="about-why-foot" data-reveal>
          <p className="about-hand about-why-caption">
            <Lines lines={c.whyCaptionLines} />
          </p>
          <svg
            className="about-why-band"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M0 120V0C30 2 64 22 96 54C132 90 220 112 314 106C356 103 386 92 400 82V120Z" />
          </svg>
        </div>
      </section>

      <section className="about-founder" aria-labelledby="about-founder-title">
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
        <figure className="about-founder-media" data-reveal>
          <svg
            className="about-founder-edge"
            viewBox="0 0 400 48"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M0 0H400V26C340 40 270 44 200 36C130 28 60 32 0 22Z" />
          </svg>
          <video
            ref={filmRef}
            className="about-founder-film"
            muted
            loop
            playsInline
            preload="metadata"
            poster={aboutMedia.founderPoster}
            disablePictureInPicture
            aria-label={c.founderAlt}
          >
            <source src={aboutMedia.founderFilm} type="video/mp4" />
          </video>
        </figure>
      </section>

      <section className="about-passage" aria-labelledby="about-passage-title">
        <div className="about-passage-copy">
          <h2 id="about-passage-title">
            <Lines lines={c.passageTitleLines} />
          </h2>
          <p>
            <Lines lines={c.passageBodyLines} />
          </p>
        </div>
        <figure className="about-passage-media" data-reveal>
          <div className="about-passage-frame">
            <Image
              src={aboutMedia.passage}
              alt={c.passageAlt}
              fill
              sizes="(max-width: 720px) 100vw, 420px"
            />
          </div>
          <span className="about-passage-brush" aria-hidden="true" />
        </figure>
      </section>

      <section className="about-not" aria-labelledby="about-not-title">
        <div className="about-not-panel">
          <h2 id="about-not-title">
            <Lines lines={c.isNotLines} />
          </h2>
          <ul data-reveal>
            {c.notItems.map((item, index) => (
              <li key={item.lines.join("-")} style={{ "--i": index } as CSSProperties}>
                <X className="about-not-x" aria-hidden="true" />
                <span>
                  <Lines lines={item.lines} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="about-not-stage">
          <figure className="about-not-media" data-reveal>
            <div className="about-not-frame">
              <Image
                src={aboutMedia.not}
                alt={c.notAlt}
                fill
                sizes="(max-width: 720px) 100vw, 420px"
              />
            </div>
            <svg className="about-roots" viewBox="0 0 120 150" aria-hidden="true" focusable="false">
              <path pathLength={1} d="M8 34C22 16 40 8 58 14C70 18 74 30 88 28C102 26 110 12 118 6" />
              <path pathLength={1} d="M88 28C96 50 90 72 104 94C112 108 110 130 116 148" />
              <path pathLength={1} d="M58 14C54 30 62 44 56 58" opacity="0.7" />
            </svg>
          </figure>
          <svg
            className="about-not-sage"
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M0 0H400V30C330 52 250 60 180 50C110 40 50 36 0 44Z" />
          </svg>
        </div>
      </section>

      <section className="about-find" aria-labelledby="about-find-title">
        <h2 id="about-find-title" className="about-display">
          <Lines lines={c.findTitleLines} />
        </h2>
        <p className="about-find-lede">
          <Lines lines={c.findLedeLines} />
        </p>
        <figure className="about-find-media" data-reveal>
          <div className="about-find-disc">
            <div className="about-find-clay">
              <Image
                src={aboutMedia.clay}
                alt={c.stampAlt}
                fill
                sizes="(max-width: 720px) 110vw, 460px"
              />
            </div>
            <span className="about-find-press" aria-hidden="true">
              <span
                className="about-find-stamp"
                style={{ "--about-stamp": `url(${aboutMedia.stamp})` } as CSSProperties}
              />
            </span>
            <svg
              className="about-thread about-find-rings"
              viewBox="0 0 100 100"
              aria-hidden="true"
              focusable="false"
            >
              <path pathLength={1} d="M50 7C74 6 93 24 93 50C93 74 74 93 50 93C26 94 7 75 7 51C6 30 22 11 44 8" />
              <path pathLength={1} d="M60 1C84 5 100 27 99 52C98 78 76 99 50 99C22 99 1 78 2 50C3 34 11 19 24 10" opacity="0.7" />
            </svg>
          </div>
        </figure>
        <Link className="about-pill about-pill-solid" href={href("/products")}>
          <span>{c.worksCta}</span>
          <ArrowIcon aria-hidden="true" />
        </Link>
        <hr className="about-rule" />
      </section>

      <section className="about-custom" aria-labelledby="about-custom-title">
        <div className="about-custom-copy">
          <h2 id="about-custom-title">
            <Lines lines={c.customTitleLines} />
          </h2>
          <p>
            <Lines lines={c.customBodyLines} />
          </p>
          <Link className="about-pill about-pill-ghost" href={href("/studio")}>
            <span>{c.customCta}</span>
            <ArrowIcon aria-hidden="true" />
          </Link>
          <hr className="about-rule" />
        </div>
        <figure className="about-once-media" data-reveal>
          <div className="about-once-frame">
            <Image
              src={aboutMedia.once}
              alt={c.onceAlt}
              fill
              sizes="(max-width: 720px) 100vw, 420px"
            />
          </div>
          <p className="about-hand about-once-line">
            <Lines lines={c.onceLines} />
          </p>
        </figure>
      </section>

      <section className="about-close" aria-labelledby="about-close-title">
        <svg
          className="about-close-edge"
          viewBox="0 0 400 72"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 72V10C36 14 70 40 120 54C180 70 264 66 322 50C356 40 384 30 400 32V72Z" />
        </svg>
        <div className="about-close-inner">
          <h2 id="about-close-title">
            <Lines lines={c.closeTitleLines} />
          </h2>
          <p>
            <Lines lines={c.closeBodyLines} />
          </p>
          <svg
            className="about-thread about-thread-close"
            viewBox="0 0 400 80"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
            data-reveal
          >
            <path pathLength={1} d="M-4 76C20 50 44 36 80 34C130 32 170 44 220 38C280 30 320 8 404 4" />
          </svg>
        </div>
      </section>
    </div>
  );
}
