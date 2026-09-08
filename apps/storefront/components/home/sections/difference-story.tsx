"use client";

import { differenceStages } from "@/components/difference/const";
import type { DifferenceStageId } from "@/components/difference/type";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale, type Locale } from "@/components/i18n";
import { museumPortraits } from "@/lib/difference";
import { useInView, useScrollStage } from "../hooks";
import "../motion/reveal.css";
import "./difference-story.css";

function stageCopy(
  portrait: (typeof museumPortraits)[number],
  stageId: DifferenceStageId,
  locale: Locale,
) {
  if (stageId === "described") return portrait.described[locale];
  if (stageId === "imagined") return portrait.imaginedNote[locale];
  if (stageId === "artist") return portrait.artistNotes[0]?.[locale];
  return portrait.materialNotes[0]?.[locale];
}

function closeness(mix: number, index: number) {
  return Math.max(0, 1 - Math.abs(mix - index));
}

export function DifferenceStory() {
  const { locale, t } = useLocale();
  const { ref: revealRef, inView } = useInView<HTMLElement>({ threshold: 0.06 });
  const { ref: scrollerRef, progress } = useScrollStage(differenceStages.length);
  const storyPortrait = museumPortraits[0];
  if (!storyPortrait) return null;

  const mix = progress * Math.max(differenceStages.length - 1, 1);
  const stage = Math.min(differenceStages.length - 1, Math.round(mix));
  const active = differenceStages[stage] ?? differenceStages[0];
  const copy = stageCopy(storyPortrait, active.id, locale);

  return (
    <section
      ref={revealRef}
      id="story"
      className={`difference-story home-reveal${inView ? " is-visible" : ""}`}
      aria-labelledby="difference-story-title"
    >
      <header className="difference-story-heading">
        <span className="eyebrow reveal-item" data-reveal="eyebrow">
          {t("differenceEyebrow")}
        </span>
        <h2 id="difference-story-title" className="reveal-item" data-reveal="heading">
          {t("homeDifferenceTitle")}
        </h2>
        <p className="difference-story-maker reveal-item" data-reveal="body">
          {storyPortrait.maker[locale]} · {storyPortrait.code}
        </p>
      </header>
      <div
        ref={scrollerRef}
        className="difference-scroll"
        style={{ ["--story-progress" as string]: String(progress) }}
      >
        <div className="difference-scroll-sticky">
          <div className="difference-scroll-frame">
            {differenceStages.map((item, index) => {
              const photo = storyPortrait.stageImages?.[item.id];
              const amount = closeness(mix, index);
              return (
                <figure
                  key={item.id}
                  className={index === stage ? "is-active" : ""}
                  aria-hidden={index !== stage}
                  style={{
                    opacity: amount,
                    zIndex: index === stage ? 1 : 0,
                  }}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt=""
                      style={{ transform: `scale(${1.08 - 0.08 * amount})` }}
                    />
                  ) : (
                    <div
                      className={`stage-${item.id}`}
                      style={{ transform: `scale(${1.08 - 0.08 * amount})` }}
                    />
                  )}
                </figure>
              );
            })}
          </div>
          <ol className="difference-scroll-progress" aria-hidden="true">
            {differenceStages.map((item, index) => (
              <li
                key={item.id}
                className={index === stage ? "is-active" : index < stage ? "is-done" : ""}
              >
                {item.index[locale]}
              </li>
            ))}
          </ol>
          <div className="difference-scroll-copy" aria-live="polite">
            <div key={active.id} className="difference-scroll-copy-inner">
              <h3>{active.title[locale]}</h3>
              <p>{copy}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="difference-scroll-static">
        {differenceStages.map((item) => {
          const photo = storyPortrait.stageImages?.[item.id];
          return (
            <article key={item.id}>
              <figure>
                {photo ? <img src={photo} alt="" /> : <div className={`stage-${item.id}`} />}
              </figure>
              <div className="difference-scroll-copy">
                <span>{item.index[locale]}</span>
                <h3>{item.title[locale]}</h3>
                <p>{stageCopy(storyPortrait, item.id, locale)}</p>
              </div>
            </article>
          );
        })}
      </div>
      <div className="difference-story-actions reveal-item" data-reveal="cta">
        <ButtonLink href={`/differences/${storyPortrait.id}`} outline>
          {t("differenceOpen")}
        </ButtonLink>
        <ButtonLink href="/differences" outline>
          {t("museumTitle")}
        </ButtonLink>
      </div>
    </section>
  );
}
