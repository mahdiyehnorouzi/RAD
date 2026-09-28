"use client";
import {
  STROKE_SPAN,
  type TexturePoint,
  type WorkTexture,
} from "@/lib/catalog/material-texture";
import { useTextureFocus } from "./use-texture-focus";

export type PaletteSample = { src: string; point: TexturePoint };

/**
 * The surfaces a work lends its brush strokes: each authored material spot,
 * or else the distinct surfaces read from its first photograph.
 */
export function useWorkPalette(textures: WorkTexture[]): PaletteSample[] {
  const lead = textures[0];
  const focus = useTextureFocus(lead?.spot ? undefined : lead);
  if (!lead) return [];
  if (lead.spot)
    return textures.flatMap(({ src, spot }) =>
      spot
        ? [
            {
              src,
              point: {
                x: spot.x,
                y: spot.y,
                span: Math.min(spot.span ?? STROKE_SPAN, STROKE_SPAN),
              },
            },
          ]
        : [],
    );
  return (focus?.palette ?? []).map((point) => ({ src: lead.src, point }));
}
