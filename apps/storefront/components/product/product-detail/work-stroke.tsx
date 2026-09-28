"use client";
import type { CSSProperties } from "react";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { useWorkPalette } from "./hooks";

/**
 * A dry brush stroke painted with one of the work's own surfaces. Strokes in
 * a list step through the work's palette and alternate their brush shape.
 */
export function WorkStroke({
  textures,
  index,
  className = "",
}: {
  textures: WorkTexture[];
  index: number;
  className?: string;
}) {
  const palette = useWorkPalette(textures);
  const sample = palette.length ? palette[index % palette.length] : undefined;
  const brush = index % 2 ? "is-b" : "is-a";

  return (
    <span
      className={`work-stroke ${brush} ${sample ? "" : "is-plain"} ${className}`}
      aria-hidden="true"
      style={
        sample
          ? ({
              "--texture-x": `${sample.point.x}%`,
              "--texture-y": `${sample.point.y}%`,
              "--texture-span": sample.point.span,
            } as CSSProperties)
          : undefined
      }
    >
      {sample ? <img src={sample.src} alt="" decoding="async" /> : null}
    </span>
  );
}
