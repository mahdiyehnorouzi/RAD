"use client";

import Image from "next/image";
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

function stageTransition(progress: number, count: number) {
  const last = Math.max(count - 1, 0);
  const position = progress * last;
  const from = Math.min(last, Math.floor(position));
  const local = position - from;
  const blend = Math.min(1, Math.max(0, (local - 0.72) / 0.28));
  const to = Math.min(last, from + 1);
  const active = blend >= 0.5 ? to : from;

  return {
    active,
    opacity(index: number) {
      if (from === to) return index === from ? 1 : 0;
      if (index === from) return 1 - blend;
      if (index === to) return blend;
      return 0;
    },
  };
}

export function DifferenceStory() {
  const { locale, t } = useLocale();
  const { ref: revealRef, inView } = useInView<HTMLElement>({
    threshold: 0.06,
  });
  const { ref: scrollerRef, progress } = useScrollStage(
    differenceStages.length,
  );
  const storyPortrait = museumPortraits[0];
  if (!storyPortrait) return null;

  const transition = stageTransition(progress, differenceStages.length);
  const stage = transition.active;
  const active = differenceStages[stage] ?? differenceStages[0];
  const copy = stageCopy(storyPortrait, active.id, locale);

  return (
    <section
      ref={revealRef}
      id="story"
      className={`difference-story home-reveal${inView ? " is-visible" : ""}`}
      aria-labelledby="difference-story-title"
    >
      <div
        ref={scrollerRef}
        className="difference-scroll"
        style={{ ["--story-progress" as string]: String(progress) }}
      >
        <div className="difference-scroll-sticky">
          <div className="difference-scroll-frame">
            {differenceStages.map((item, index) => {
              const photo = storyPortrait.stageImages?.[item.id];
              const amount = transition.opacity(index);
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
                    <Image
                      className="difference-scroll-photo"
                      src={photo}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 100vw, 52vw"
                      priority={index === 0}
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
          <div className="difference-scroll-panel">
            <div className="difference-scroll-progress">
              <header className="difference-story-heading">
                <h2
                  id="difference-story-title"
                  className="reveal-item"
                  data-reveal="heading"
                >
                  {t("homeDifferenceTitle")}
                </h2>
                <p className="difference-story-maker reveal-item" data-reveal="body">
                  {storyPortrait.maker[locale]} · {storyPortrait.code}
                </p>
              </header>
              <ol aria-hidden="true">
                {differenceStages.map((item, index) => (
                  <li
                    key={item.id}
                    className={
                      index === stage
                        ? "is-active"
                        : index < stage
                          ? "is-done"
                          : ""
                    }
                  >
                    {item.index[locale]}
                  </li>
                ))}
              </ol>
            </div>
            <div className="difference-scroll-copy" aria-live="polite">
              <div key={active.id} className="difference-scroll-copy-inner">
                <h3>{active.title[locale]}</h3>
                <p>{copy}</p>
              </div>
            </div>
            <div className="difference-story-actions reveal-item" data-reveal="cta">
              <ButtonLink href={`/differences/${storyPortrait.id}`} outline>
                {t("differenceOpen")}
              </ButtonLink>
              <ButtonLink href="/differences" outline>
                {t("museumTitle")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
      <div className="difference-scroll-static">
        <header className="difference-story-heading">
          <h2>{t("homeDifferenceTitle")}</h2>
          <p className="difference-story-maker">
            {storyPortrait.maker[locale]} · {storyPortrait.code}
          </p>
        </header>
        {differenceStages.map((item) => {
          const photo = storyPortrait.stageImages?.[item.id];
          return (
            <article key={item.id}>
              <figure>
                {photo ? (
                  <img src={photo} alt="" />
                ) : (
                  <div className={`stage-${item.id}`} />
                )}
              </figure>
              <div className="difference-scroll-copy">
                <span>{item.index[locale]}</span>
                <h3>{item.title[locale]}</h3>
                <p>{stageCopy(storyPortrait, item.id, locale)}</p>
              </div>
            </article>
          );
        })}
        <div className="difference-story-actions">
          <ButtonLink href={`/differences/${storyPortrait.id}`} outline>
            {t("differenceOpen")}
          </ButtonLink>
          <ButtonLink href="/differences" outline>
            {t("museumTitle")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
