"use client";
import type { CSSProperties } from "react";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { useTextureFocus } from "./hooks";

/**
 * A crop of the work's own photograph: a short glaze tab that leads a
 * hairline rule, or a round swatch beside a material. The rule stays a bare
 * hairline until the picture is read, or when the work has no photo to lend.
 */
export function MaterialTexture({
  texture,
  shape,
  className = "",
}: {
  texture?: WorkTexture;
  shape: "strip" | "swatch";
  className?: string;
}) {
  const focus = useTextureFocus(texture);
  const point = shape === "strip" ? focus?.strip : focus?.swatch;
  const crop =
    texture && point ? (
      <span
        className={`material-texture is-${shape === "strip" ? "tab" : "swatch"}`}
        aria-hidden="true"
        style={
          {
            "--texture-x": `${point.x}%`,
            "--texture-y": `${point.y}%`,
            "--texture-span": point.span,
          } as CSSProperties
        }
      >
        <img src={texture.src} alt="" decoding="async" />
      </span>
    ) : null;

  if (shape === "swatch") return crop;
  return (
    <span className={`material-rule ${className}`} aria-hidden="true">
      {crop}
    </span>
  );
}
