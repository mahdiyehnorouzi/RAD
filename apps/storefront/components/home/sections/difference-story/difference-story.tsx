"use client";

import Image from "next/image";
import { differenceStages } from "@/components/difference/const";
import type {
  DifferencePortrait,
  DifferenceStageId,
} from "@/components/difference/type";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale, type Locale } from "@/components/i18n";
import { useInView, useScrollStage } from "../../hooks";
import { StoryCard } from "./story-card";
import { StoryStepper } from "./story-stepper";
import "../../motion/reveal.css";
import "./difference-story.css";

function stageCopy(
  portrait: DifferencePortrait,
  stageId: DifferenceStageId,
  locale: Locale,
) {
  if (stageId === "described") return portrait.described[locale];
  if (stageId === "imagined") return portrait.imaginedNote[locale];
  if (stageId === "artist") return portrait.artistNotes[0]?.[locale];
  return portrait.materialNotes[0]?.[locale];
}

/** Names the work so the section heading is never read as its story. */
function byline(portrait: DifferencePortrait, locale: Locale) {
  const title = portrait.title ? ` — ${portrait.title[locale]}` : "";
  return `${portrait.code}${title} · ${portrait.maker[locale]}`;
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

function StagePhoto({
  portrait,
  stageId,
  priority = false,
}: {
  portrait: DifferencePortrait;
  stageId: DifferenceStageId;
  priority?: boolean;
}) {
  const photo = portrait.stageImages?.[stageId];
  if (!photo) {
    return (
      <div
        className="story-photo"
        style={{ background: portrait.palette[stageId].color }}
      />
    );
  }
  return (
    <Image
      className="story-photo"
      src={photo}
      alt=""
      fill
      sizes="(max-width: 900px) 100vw, 56vw"
      priority={priority}
    />
  );
}

export function DifferenceStory({
  portrait: storyPortrait,
}: {
  portrait?: DifferencePortrait;
}) {
  const { locale, t } = useLocale();
  const { ref: revealRef, inView } = useInView<HTMLElement>({
    threshold: 0.06,
  });
  const {
    ref: scrollerRef,
    node: scroller,
    progress,
  } = useScrollStage(differenceStages.length);
  if (!storyPortrait) return null;

  const transition = stageTransition(progress, differenceStages.length);
  const stage = transition.active;
  const copyAt = (index: number) =>
    stageCopy(storyPortrait, differenceStages[index].id, locale);

  const goToStage = (index: number) => {
    if (!scroller) return;
    const range = scroller.offsetHeight - window.innerHeight;
    const start = scroller.getBoundingClientRect().top + window.scrollY;
    const last = differenceStages.length - 1;
    window.scrollTo({
      top: start + (range * index) / last,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={revealRef}
      id="story"
      className={`difference-story home-reveal${inView ? " is-visible" : ""}`}
      aria-labelledby="difference-story-title"
    >
      <div
        ref={scrollerRef}
        className="story-scroll"
        style={{ ["--story-progress" as string]: String(progress) }}
      >
        <div className="story-sticky">
          <div className="story-frame">
            {differenceStages.map((item, index) => {
              const amount = transition.opacity(index);
              return (
                <figure
                  key={item.id}
                  aria-hidden="true"
                  style={{
                    opacity: amount,
                    zIndex: index === stage ? 1 : 0,
                    transform: `scale(${1.06 - 0.06 * amount})`,
                  }}
                >
                  <StagePhoto
                    portrait={storyPortrait}
                    stageId={item.id}
                    priority={index === 0}
                  />
                </figure>
              );
            })}
          </div>
          <header className="story-head reveal-item" data-reveal="heading">
            <h2 id="difference-story-title">{t("homeDifferenceTitle")}</h2>
            <p className="story-byline">{byline(storyPortrait, locale)}</p>
            <StoryStepper active={stage} onSelect={goToStage} />
          </header>
          <div className="story-card-slot reveal-item" data-reveal="body">
            <StoryCard
              active={stage}
              copy={copyAt}
              portraitId={storyPortrait.id}
            />
          </div>
        </div>
      </div>

      <div className="story-static">
        <header className="story-head">
          <h2>{t("homeDifferenceTitle")}</h2>
          <p className="story-byline">{byline(storyPortrait, locale)}</p>
        </header>
        <ol className="story-static-list">
          {differenceStages.map((item, index) => (
            <li key={item.id}>
              <figure>
                <StagePhoto portrait={storyPortrait} stageId={item.id} />
              </figure>
              <div className="story-static-copy">
                <span className="story-tag">
                  {item.index[locale]}
                  <span className="story-tag-rule" aria-hidden="true">
                    /
                  </span>
                  {item.label[locale]}
                </span>
                <h3>{item.title[locale]}</h3>
                <p>{copyAt(index)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="story-actions">
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
