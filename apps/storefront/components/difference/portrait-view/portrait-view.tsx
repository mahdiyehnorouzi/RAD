"use client";
import "./portrait-view.css";

import { useEffect, useId, useState } from "react";
import { useLocale } from "@/components/i18n";
import { differenceStages, surprisePermissions } from "../const";
import type { DifferencePortrait, DifferenceStageId } from "../type";
import { PortraitCertificate } from "./portrait-certificate";
import { PortraitTabs } from "./portrait-tabs";
import { StageVisual } from "./stage-visual";

export function DifferencePortraitView({
  portrait,
  image,
  privateReveal = false,
}: {
  portrait: DifferencePortrait;
  image?: string;
  privateReveal?: boolean;
}) {
  const { locale, t } = useLocale();
  const tabId = useId();
  const [stage, setStage] = useState<DifferenceStageId>(
    privateReveal ? "described" : "material",
  );
  const [playing, setPlaying] = useState(false);
  const permission = surprisePermissions.find((item) => item.id === portrait.permission);
  const activeMeta = differenceStages.find((item) => item.id === stage);
  const notes =
    stage === "artist"
      ? portrait.artistNotes
      : stage === "material"
        ? portrait.materialNotes
        : stage === "imagined"
          ? [portrait.imaginedNote]
          : [portrait.described];

  useEffect(() => {
    if (!playing) return;
    const order: DifferenceStageId[] = ["described", "imagined", "artist", "material"];
    let index = 0;
    setStage("described");
    const timer = window.setInterval(() => {
      index += 1;
      if (index >= order.length) {
        window.clearInterval(timer);
        setPlaying(false);
        setStage("material");
        return;
      }
      setStage(order[index]);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [playing]);

  function selectStage(id: DifferenceStageId) {
    setPlaying(false);
    setStage(id);
  }

  return (
    <article className="difference-portrait">
      <header className="difference-portrait-head">
        <span className="eyebrow">{t("differenceEyebrow")}</span>
        <h2>{t("differenceTitle")}</h2>
        <p>{t("differenceBody")}</p>
        <div className="difference-meta">
          <b dir="ltr">{portrait.code}</b>
          <span>{portrait.maker[locale]}</span>
          {permission ? <span>{permission.title[locale]}</span> : null}
        </div>
      </header>

      <PortraitTabs tabId={tabId} stage={stage} onSelect={selectStage} />

      <div
        className="difference-stage-panel"
        role="tabpanel"
        id={`${tabId}-panel`}
        aria-labelledby={`${tabId}-${stage}`}
      >
        <StageVisual portrait={portrait} stage={stage} image={image} locale={locale} />
        <div className="difference-annotations">
          <small>{activeMeta?.title[locale]}</small>
          <ul>
            {notes.map((note) => (
              <li key={note.en}>{note[locale]}</li>
            ))}
          </ul>
          {privateReveal ? (
            <button
              type="button"
              className="button light"
              onClick={() => setPlaying(true)}
              disabled={playing}
            >
              {playing ? t("differenceRevealing") : t("differenceReveal")}
            </button>
          ) : null}
        </div>
      </div>

      <PortraitCertificate portrait={portrait} />
    </article>
  );
}
