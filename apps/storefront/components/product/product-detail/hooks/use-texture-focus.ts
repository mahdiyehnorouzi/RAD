"use client";
import { useEffect, useState } from "react";
import {
  focusFromOpacity,
  spotFocus,
  type TextureFocus,
  type WorkTexture,
} from "@/lib/catalog/material-texture";

const GRID = 64;
const read = new Map<string, Promise<TextureFocus | null>>();

function readPhoto(src: string) {
  const known = read.get(src);
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
        const solid = new Uint8Array(width * height);
        for (let index = 0; index < solid.length; index += 1)
          solid[index] = data[index * 4 + 3] > 200 ? 1 : 0;
        resolve(focusFromOpacity(solid, width, height));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
  read.set(src, pending);
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

  useEffect(() => {
    if (!src || spot) return;
    let active = true;
    void readPhoto(src).then((focus) => {
      if (active) setFound({ src, focus });
    });
    return () => {
      active = false;
    };
  }, [src, spot]);

  if (!texture) return null;
  if (spot) return spotFocus(spot);
  return found && found.src === src ? found.focus : null;
}
