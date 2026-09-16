"use client";
import "./portrait-view.css";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import {
  BeforeRad,
  stageFromProgress,
  type BeforeRadFrame,
  type BeforeRadStageId,
} from "@/components/passport";
import { surprisePermissions } from "../const";
import type { DifferencePortrait } from "../type";
import { findPassport } from "@/lib/passport";
import { PortraitCertificate } from "./portrait-certificate";

const stageNotes: Record<BeforeRadStageId, (portrait: DifferencePortrait) => DifferencePortrait["described"][]> = {
  idea: (portrait) => [portrait.described],
  hand: (portrait) => portrait.artistNotes,
  material: (portrait) => [portrait.imaginedNote],
  rad: (portrait) => portrait.materialNotes,
};

function framesFromPortrait(portrait: DifferencePortrait, image?: string): BeforeRadFrame[] {
  const images = portrait.stageImages;
  return [
    {
      id: "idea",
      src: images?.described,
      color: portrait.palette.described.color,
      accent: portrait.palette.described.accent,
      caption: portrait.described,
    },
    {
      id: "hand",
      src: images?.artist,
      color: portrait.palette.artist.color,
      accent: portrait.palette.artist.accent,
      caption: portrait.artistNotes[0],
    },
    {
      id: "material",
      src: images?.imagined,
      color: portrait.palette.imagined.color,
      accent: portrait.palette.imagined.accent,
      caption: portrait.imaginedNote,
    },
    {
      id: "rad",
      src: image ?? images?.material,
      color: portrait.palette.material.color,
      accent: portrait.palette.material.accent,
      caption: portrait.materialNotes[0],
    },
  ];
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
  const { locale, t, href } = useLocale();
  const [progress, setProgress] = useState(privateReveal ? 0 : 1);
  const stage = stageFromProgress(progress);
  const permission = surprisePermissions.find((item) => item.id === portrait.permission);
  const notes = stageNotes[stage](portrait);
  const passport = findPassport(portrait.id) ?? findPassport(portrait.code);

  return (
    <article className="difference-portrait">
      <header className="difference-portrait-head">
        <span className="eyebrow">{t("differenceEyebrow")}</span>
        <h1>{t("differenceTitle")}</h1>
        <p>{t("differenceBody")}</p>
        <div className="difference-meta">
          <b dir="ltr">{portrait.code}</b>
          <span>{portrait.maker[locale]}</span>
          {permission ? <span>{permission.title[locale]}</span> : null}
        </div>
      </header>

      <BeforeRad
        frames={framesFromPortrait(portrait, image)}
        value={progress}
        onChange={setProgress}
      />

      <div className="difference-annotations">
        <ul>
          {notes.map((note) => (
            <li key={note.en}>{note[locale]}</li>
          ))}
        </ul>
        {passport ? (
          <Link href={href(`/passport/${passport.code}`)}>{t("pdpPassportLink")}</Link>
        ) : null}
      </div>

      <PortraitCertificate portrait={portrait} />
    </article>
  );
}
