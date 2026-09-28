"use client";
import type { CSSProperties } from "react";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { useTextureFocus } from "./hooks";

/**
 * A magnified crop of the work's own photograph: a long glaze strip used as
 * a divider, or a round swatch beside a material. A strip keeps a hairline
 * until the picture is read, or when the work has no photograph to lend.
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

  if (!texture || !point) {
    return shape === "strip" ? (
      <span className={`material-texture is-strip is-plain ${className}`} />
    ) : null;
  }

  return (
    <span
      className={`material-texture is-${shape} ${className}`}
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
  );
}
