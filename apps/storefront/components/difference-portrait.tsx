"use client";

import { useEffect, useId, useState } from "react";
import { ArtworkVisual } from "@/components/product/artwork-visual";
import "@/components/product/artwork.css";
import { useLocale } from "@/components/i18n";
import {
  differenceStages,
  surprisePermissions,
  type DifferencePortrait,
  type DifferenceStageId,
} from "@/lib/beautiful-difference";

function CertificateMark({ code }: { code: string }) {
  return (
    <svg className="difference-qr" viewBox="0 0 72 72" aria-hidden="true">
      <rect width="72" height="72" fill="#f7f2e9" />
      <rect x="4" y="4" width="18" height="18" fill="#18231f" />
      <rect x="50" y="4" width="18" height="18" fill="#18231f" />
      <rect x="4" y="50" width="18" height="18" fill="#18231f" />
      <rect x="10" y="10" width="6" height="6" fill="#f7f2e9" />
      <rect x="56" y="10" width="6" height="6" fill="#f7f2e9" />
      <rect x="10" y="56" width="6" height="6" fill="#f7f2e9" />
      <rect x="30" y="8" width="5" height="5" fill="#18231f" />
      <rect x="40" y="14" width="6" height="6" fill="#8a4938" />
      <rect x="28" y="28" width="16" height="16" fill="#263d34" />
      <rect x="48" y="32" width="8" height="8" fill="#18231f" />
      <rect x="32" y="50" width="6" height="14" fill="#18231f" />
      <rect x="52" y="52" width="10" height="4" fill="#8a4938" />
      <title>{code}</title>
    </svg>
  );
}

function StageVisual({
  portrait,
  stage,
  image,
  locale,
}: {
  portrait: DifferencePortrait;
  stage: DifferenceStageId;
  image?: string;
  locale: "fa" | "en";
}) {
  const palette = portrait.palette[stage];
  const treatment = `difference-stage-art stage-${stage} permission-${portrait.permission}`;
  if (image && stage !== "described") {
    return (
      <div className={treatment}>
        <img src={image} alt="" />
      </div>
    );
  }
  return (
    <div className={treatment}>
      {stage === "described" ? (
        <p className="difference-described-text">{portrait.described[locale]}</p>
      ) : (
        <ArtworkVisual
          visual={portrait.visual}
          color={palette.color}
          accent={palette.accent}
        />
      )}
    </div>
  );
}

export function DifferenceTrailStrip({
  portrait,
  labelledBy,
}: {
  portrait: DifferencePortrait;
  labelledBy?: string;
}) {
  const { locale } = useLocale();
  return (
    <ol className="difference-strip" aria-labelledby={labelledBy}>
      {differenceStages.map((item) => {
        const palette = portrait.palette[item.id];
        return (
          <li key={item.id}>
            <span>{item.index[locale]}</span>
            <div
              className={`difference-strip-swatch stage-${item.id}`}
              style={
                {
                  "--swatch": palette.color,
                  "--swatch-accent": palette.accent,
                } as React.CSSProperties
              }
              aria-hidden="true"
            />
            <b>{item.title[locale]}</b>
          </li>
        );
      })}
    </ol>
  );
}

export function DifferencePortraitView({
  portrait,
  image,
  privateReveal = false,
}: {
  portrait: DifferencePortrait;
  image?: string;
  privateReveal?: boolean;
}) {
  const { locale, t, number } = useLocale();
  const tabId = useId();
  const [stage, setStage] = useState<DifferenceStageId>(
    privateReveal ? "described" : "material",
  );
  const [playing, setPlaying] = useState(false);
  const permission = surprisePermissions.find(
    (item) => item.id === portrait.permission,
  );
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
    const order: DifferenceStageId[] = [
      "described",
      "imagined",
      "artist",
      "material",
    ];
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

      <div
        className="difference-stage-tabs"
        role="tablist"
        aria-label={t("differenceTrail")}
      >
        {differenceStages.map((item) => {
          const selected = item.id === stage;
          return (
            <button
              type="button"
              role="tab"
              id={`${tabId}-${item.id}`}
              key={item.id}
              aria-selected={selected}
              aria-controls={`${tabId}-panel`}
              tabIndex={selected ? 0 : -1}
              className={selected ? "active" : ""}
              onClick={() => {
                setPlaying(false);
                setStage(item.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft")
                  return;
                event.preventDefault();
                const next =
                  event.key === (locale === "fa" ? "ArrowLeft" : "ArrowRight")
                    ? 1
                    : -1;
                const current = differenceStages.findIndex(
                  (step) => step.id === stage,
                );
                const target =
                  differenceStages[
                    (current + next + differenceStages.length) %
                      differenceStages.length
                  ];
                setPlaying(false);
                setStage(target.id);
                document
                  .getElementById(`${tabId}-${target.id}`)
                  ?.focus();
              }}
            >
              <small>{item.index[locale]}</small>
              <span>{item.title[locale]}</span>
            </button>
          );
        })}
      </div>

      <div
        className="difference-stage-panel"
        role="tabpanel"
        id={`${tabId}-panel`}
        aria-labelledby={`${tabId}-${stage}`}
      >
        <StageVisual
          portrait={portrait}
          stage={stage}
          image={image}
          locale={locale}
        />
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

      <aside className="difference-certificate" aria-label={t("differenceCertificate")}>
        <CertificateMark code={portrait.code} />
        <div>
          <span className="eyebrow">{t("differenceCertificate")}</span>
          <p>{t("differenceCertificateBody")}</p>
          <dl className="material-fingerprint">
            <div>
              <dt>{t("fingerprintBatch")}</dt>
              <dd>{portrait.fingerprint.clay[locale]}</dd>
            </div>
            <div>
              <dt>{t("fingerprintSurface")}</dt>
              <dd>{portrait.fingerprint.glaze[locale]}</dd>
            </div>
            <div>
              <dt>{t("fingerprintFiring")}</dt>
              <dd>{portrait.fingerprint.firing[locale]}</dd>
            </div>
            <div>
              <dt>{t("fingerprintMark")}</dt>
              <dd>{portrait.fingerprint.irregularity[locale]}</dd>
            </div>
          </dl>
          <p className="difference-year" dir="ltr">
            {portrait.code} · TEHRAN / {portrait.year} · {number(1)} /{" "}
            {number(1)}
          </p>
        </div>
      </aside>
    </article>
  );
}

