"use client";
import "./trail-strip.css";

import { useLocale } from "@/components/i18n";
import { differenceStages } from "./const";
import type { DifferencePortrait } from "./type";

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
        const photo = portrait.stageImages?.[item.id];
        return (
          <li key={item.id} title={item.title[locale]}>
            {photo ? (
              <img className="difference-strip-swatch" src={photo} alt="" loading="lazy" />
            ) : (
              <span
                className="difference-strip-swatch"
                style={
                  {
                    "--swatch": palette.color,
                    "--swatch-accent": palette.accent,
                  } as React.CSSProperties
                }
                aria-hidden="true"
              />
            )}
            <span className="difference-strip-label">{item.label[locale]}</span>
          </li>
        );
      })}
    </ol>
  );
}
