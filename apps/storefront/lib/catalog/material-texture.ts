import type { MaterialSpot, Product } from "@rad/types";
import {
  isFileProductImage,
  productPhotoSrc,
} from "@/lib/catalog/category-defaults";
import {
  catalogLifestylePhotoSlugs,
  catalogPhotoSrc,
} from "@/lib/catalog/photo-works";

/** One of the work's own photographs, optionally pinned to an authored spot. */
export type WorkTexture = { src: string; spot?: MaterialSpot };

export type TexturePoint = { x: number; y: number; span: number };

export type TextureFocus = { strip?: TexturePoint; swatch: TexturePoint };

/** A swatch shows this share of the photo's width: close enough to read as material. */
export const SWATCH_SPAN = 0.16;
const MIN_STRIP_SPAN = 0.14;

function texturePhotoSrc(product: Product, index: number, src?: string) {
  if (catalogLifestylePhotoSlugs.has(product.slug))
    return catalogPhotoSrc(product.slug, index);
  return isFileProductImage(src) ? productPhotoSrc(src) : null;
}

/**
 * Photographic material samples for a work, widest authored spot first. A
 * work with photos but no authored spots lends its first photo, and the spot
 * is found from the picture itself. Drawn-only works have none.
 */
export function workTextures(product: Product): WorkTexture[] {
  const images = product.images ?? [];
  const authored = images
    .flatMap((image, index) => {
      const src = texturePhotoSrc(product, index, image.src);
      return src ? (image.spots ?? []).map((spot) => ({ src, spot })) : [];
    })
    .sort((a, b) => (b.spot.span ?? 0) - (a.spot.span ?? 0));
  if (authored.length) return authored;
  const src = texturePhotoSrc(product, 0, images[0]?.src);
  return src ? [{ src }] : [];
}

export function spotFocus(spot: MaterialSpot): TextureFocus {
  const point = { x: spot.x, y: spot.y, span: SWATCH_SPAN };
  return {
    swatch: point,
    strip: spot.span ? { ...point, span: spot.span } : undefined,
  };
}

/**
 * Reads a coarse opacity map of a cut-out photo. The swatch sits at the point
 * deepest inside the object; the strip follows the longest run that stays
 * solid for three rows, nearest the middle when runs tie.
 */
export function focusFromOpacity(
  solid: Uint8Array,
  width: number,
  height: number,
): TextureFocus | null {
  const depth = new Float32Array(width * height);
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? 0 : depth[y * width + x];
  for (let index = 0; index < depth.length; index += 1)
    depth[index] = solid[index] ? width + height : 0;
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!depth[index]) continue;
      depth[index] = Math.min(
        depth[index],
        at(x - 1, y) + 1,
        at(x, y - 1) + 1,
        at(x - 1, y - 1) + 1.4,
        at(x + 1, y - 1) + 1.4,
      );
    }
  for (let y = height - 1; y >= 0; y -= 1)
    for (let x = width - 1; x >= 0; x -= 1) {
      const index = y * width + x;
      if (!depth[index]) continue;
      depth[index] = Math.min(
        depth[index],
        at(x + 1, y) + 1,
        at(x, y + 1) + 1,
        at(x + 1, y + 1) + 1.4,
        at(x - 1, y + 1) + 1.4,
      );
    }

  const centreDistance = (x: number, y: number) =>
    Math.hypot(x - width / 2, y - height / 2);
  let deepest = { x: 0, y: 0, depth: 0 };
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const value = depth[y * width + x];
      if (
        value > deepest.depth + 0.01 ||
        (Math.abs(value - deepest.depth) <= 0.01 &&
          centreDistance(x, y) < centreDistance(deepest.x, deepest.y))
      )
        deepest = { x, y, depth: value };
    }
  if (deepest.depth < 2) return null;

  const runs: { y: number; start: number; length: number }[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    let start = -1;
    for (let x = 0; x <= width; x += 1) {
      const filled =
        x < width &&
        solid[(y - 1) * width + x] &&
        solid[y * width + x] &&
        solid[(y + 1) * width + x];
      if (filled && start < 0) start = x;
      if (!filled && start >= 0) {
        runs.push({ y, start, length: x - start });
        start = -1;
      }
    }
  }
  const longest = Math.max(0, ...runs.map((run) => run.length));
  const run = runs
    .filter((item) => item.length >= longest * 0.92)
    .sort(
      (a, b) =>
        centreDistance(a.start + a.length / 2, a.y) -
        centreDistance(b.start + b.length / 2, b.y),
    )[0];
  const span = run ? (run.length / width) * 0.9 : 0;

  return {
    swatch: {
      x: ((deepest.x + 0.5) / width) * 100,
      y: ((deepest.y + 0.5) / height) * 100,
      span: SWATCH_SPAN,
    },
    strip:
      run && span >= MIN_STRIP_SPAN
        ? {
            x: ((run.start + run.length / 2) / width) * 100,
            y: ((run.y + 0.5) / height) * 100,
            span,
          }
        : undefined,
  };
}
