"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "@/components/i18n";
import { BEFORE_RAD_STAGE_KEY } from "./const";
import { BEFORE_RAD_STAGES, type BeforeRadFrame, type BeforeRadStageId } from "./type";
import "./before-rad.css";

function nearestStage(progress: number): BeforeRadStageId {
  const index = Math.min(BEFORE_RAD_STAGES.length - 1, Math.round(progress * (BEFORE_RAD_STAGES.length - 1)));
  return BEFORE_RAD_STAGES[index];
}

export function stageFromProgress(progress: number) {
  return nearestStage(progress);
}

export function BeforeRad({
  frames,
  value,
  onChange,
}: {
  frames: BeforeRadFrame[];
  value?: number;
  onChange?: (progress: number, stage: BeforeRadStageId) => void;
}) {
  const { locale, t } = useLocale();
  const labelId = useId();
  const surface = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState(1);
  const progress = value ?? internal;
  const stage = nearestStage(progress);
  const active = frames.find((frame) => frame.id === stage) ?? frames[frames.length - 1];

  function setProgress(next: number) {
    const clamped = Math.min(1, Math.max(0, next));
    if (value === undefined) setInternal(clamped);
    onChange?.(clamped, nearestStage(clamped));
  }

  function fromClientX(clientX: number) {
    const box = surface.current?.getBoundingClientRect();
    if (!box) return;
    const ratio = (clientX - box.left) / box.width;
    const rtl = locale === "fa";
    setProgress(rtl ? 1 - ratio : ratio);
  }

  return (
    <section className="before-rad" aria-labelledby={labelId}>
      <header>
        <span className="eyebrow">{t("beforeRadTitle")}</span>
        <h2 id={labelId}>{t("beforeRadTitle")}</h2>
        <p>{t("beforeRadBody")}</p>
      </header>

      <div
        ref={surface}
        className="before-rad-surface"
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuetext={`${t(BEFORE_RAD_STAGE_KEY[stage])}`}
        aria-label={t("beforeRadTitle")}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          fromClientX(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            fromClientX(event.clientX);
          }
        }}
        onKeyDown={(event) => {
          const step = locale === "fa" ? -0.12 : 0.12;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setProgress(progress - step);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            setProgress(progress + step);
          }
          if (event.key === "Home") {
            event.preventDefault();
            setProgress(0);
          }
          if (event.key === "End") {
            event.preventDefault();
            setProgress(1);
          }
        }}
      >
        {frames.map((frame, index) => {
          const point = index / Math.max(1, frames.length - 1);
          const opacity = Math.max(0, 1 - Math.abs(progress - point) * (frames.length - 1));
          return (
            <figure
              key={frame.id}
              className={frame.id === stage ? "is-active" : ""}
              style={
                {
                  opacity,
                  "--before-color": frame.color,
                  "--before-accent": frame.accent,
                } as CSSProperties
              }
            >
              {frame.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={frame.src} alt="" />
              ) : (
                <div className="before-rad-field" />
              )}
            </figure>
          );
        })}
        <span className="before-rad-hint" aria-hidden="true">
          {t("beforeRadHint")}
        </span>
      </div>

      <label className="before-rad-slider">
        <span className="visually-hidden">{t("beforeRadTitle")}</span>
        <input
          type="range"
          min={0}
          max={100}
          dir={locale === "fa" ? "rtl" : "ltr"}
          value={Math.round(progress * 100)}
          onChange={(event) => setProgress(Number(event.target.value) / 100)}
        />
        <ol>
          {BEFORE_RAD_STAGES.map((id) => (
            <li key={id} className={id === stage ? "is-active" : ""}>
              <button type="button" onClick={() => setProgress(BEFORE_RAD_STAGES.indexOf(id) / 3)}>
                {t(BEFORE_RAD_STAGE_KEY[id])}
              </button>
            </li>
          ))}
        </ol>
      </label>

      {active ? <p className="before-rad-caption">{active.caption[locale]}</p> : null}
    </section>
  );
}
