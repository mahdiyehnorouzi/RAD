"use client";

import { ArtworkVisual } from "@/components/product/artwork-visual";
import type { DifferencePortrait, DifferenceStageId } from "../type";

export function StageVisual({
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
