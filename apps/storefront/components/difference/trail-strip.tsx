"use client";

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
