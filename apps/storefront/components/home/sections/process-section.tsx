"use client";

import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { homeProcessSteps } from "../const";
import { useInView, useScrollStage } from "../hooks";
import "../motion/reveal.css";
import "./process-section.css";

function closeness(mix: number, index: number) {
  return Math.max(0, 1 - Math.abs(mix - index));
}

export function HomeProcessSection() {
  const { t } = useLocale();
  const { ref: revealRef, inView } = useInView<HTMLElement>({ threshold: 0.08 });
  const { ref: scrollerRef, progress } = useScrollStage(homeProcessSteps.length);
  const mix = progress * Math.max(homeProcessSteps.length - 1, 1);
  const stage = Math.min(homeProcessSteps.length - 1, Math.round(mix));
  const current = homeProcessSteps[stage] ?? homeProcessSteps[0];

  return (
    <section
      ref={revealRef}
      className={`home-process home-reveal${inView ? " is-visible" : ""}`}
      aria-labelledby="home-process-title"
    >
      <header className="home-process-heading">
        <span className="eyebrow reveal-item" data-reveal="eyebrow">
          {t("homeProcessEyebrow")}
        </span>
        <h2 id="home-process-title" className="reveal-item" data-reveal="heading">
          {t("processTitle")}
        </h2>
        <p className="reveal-item" data-reveal="body">
          {t("homeProcessLead")}
        </p>
      </header>
      <div
        ref={scrollerRef}
        className="home-process-track"
        style={{ ["--process-progress" as string]: String(progress) }}
      >
        <div className="home-process-board">
          <ol className="home-process-path">
            {homeProcessSteps.map((step, index) => (
              <li
                key={step.index}
                className={
                  index === stage ? "is-active" : index < stage ? "is-done" : ""
                }
                aria-current={index === stage ? "step" : undefined}
              >
                <span>{t(step.index)}</span>
                <strong>{t(step.title)}</strong>
              </li>
            ))}
          </ol>
          <div className="home-process-stage">
            {homeProcessSteps.map((step, index) => (
              <figure
                key={step.image}
                className={index === stage ? "is-active" : ""}
                aria-hidden={index !== stage}
                style={{
                  opacity: closeness(mix, index),
                  zIndex: index === stage ? 1 : 0,
                }}
              >
                <Image
                  src={step.image}
                  alt={t(step.title)}
                  fill
                  sizes="(max-width: 900px) 100vw, 72vw"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </figure>
            ))}
          </div>
          <div className="home-process-caption" aria-live="polite">
            <div key={current.index} className="home-process-caption-inner">
              <h3>{t(current.title)}</h3>
              <p>{t(current.body)}</p>
            </div>
            <ButtonLink href="/studio">{t("startCustomDesign")}</ButtonLink>
          </div>
        </div>
      </div>
      <div className="home-process-static">
        {homeProcessSteps.map((step) => (
          <article key={step.index}>
            <span>{t(step.index)}</span>
            <h3>{t(step.title)}</h3>
            <p>{t(step.body)}</p>
            <figure>
              <Image src={step.image} alt={t(step.title)} fill sizes="100vw" />
            </figure>
          </article>
        ))}
        <ButtonLink href="/studio">{t("startCustomDesign")}</ButtonLink>
      </div>
    </section>
  );
}
