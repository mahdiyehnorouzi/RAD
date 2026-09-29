"use client";
import { useEffect, useState } from "react";
import {
  focusFromPhoto,
  spotFocus,
  type TextureFocus,
  type WorkTexture,
} from "@/lib/catalog/material-texture";

const GRID = 96;
const read = new Map<string, Promise<TextureFocus | null>>();

function readPhoto(src: string, tone?: string) {
  const key = `${src}|${tone ?? ""}`;
  const known = read.get(key);
  if (known) return known;
  const pending = new Promise<TextureFocus | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      try {
        const width = GRID;
        const height = Math.max(
          3,
          Math.round((GRID * image.naturalHeight) / image.naturalWidth),
        );
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0, width, height);
        const { data } = context.getImageData(0, 0, width, height);
        const alpha = new Uint8ClampedArray(width * height);
        const rgb = new Float32Array(width * height * 3);
        for (let index = 0; index < alpha.length; index += 1) {
          alpha[index] = data[index * 4 + 3];
          for (let channel = 0; channel < 3; channel += 1)
            rgb[index * 3 + channel] = data[index * 4 + channel] / 255;
        }
        resolve(focusFromPhoto({ width, height, alpha, rgb }, tone));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
  read.set(key, pending);
  return pending;
}

/** Where to magnify a work's photo; authored spots answer at once. */
export function useTextureFocus(texture?: WorkTexture) {
  const [found, setFound] = useState<{
    src: string;
    focus: TextureFocus | null;
  } | null>(null);
  const spot = texture?.spot;
  const src = texture?.src;
  const tone = texture?.tone;

  useEffect(() => {
    if (!src || spot) return;
    let active = true;
    void readPhoto(src, tone).then((focus) => {
      if (active) setFound({ src, focus });
    });
    return () => {
      active = false;
    };
  }, [src, spot, tone]);

  if (!texture) return null;
  if (spot) return spotFocus(spot);
  return found && found.src === src ? found.focus : null;
}
