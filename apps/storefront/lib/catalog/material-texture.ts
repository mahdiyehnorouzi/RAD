import type { MaterialSpot, Product } from "@rad/types";
import {
  isFileProductImage,
  productPhotoSrc,
} from "@/lib/catalog/category-defaults";
import {
  catalogLifestylePhotoSlugs,
  catalogPhotoSrc,
} from "@/lib/catalog/photo-works";

/**
 * One of the work's own photographs, optionally pinned to an authored spot.
 * `tone` is the work's recorded colour, which the picture is searched for.
 */
export type WorkTexture = { src: string; spot?: MaterialSpot; tone?: string };

export type TexturePoint = { x: number; y: number; span: number };

export type TextureFocus = {
  strip?: TexturePoint;
  swatch?: TexturePoint;
  /** Up to four distinct surfaces of the work, its own colour first. */
  palette?: TexturePoint[];
};

/** A swatch shows this share of the photo's width: close enough to read as material. */
export const SWATCH_SPAN = 0.16;
/** The strip is a short glaze tab this many times wider than tall, shown near natural scale. */
const STRIP_ASPECT = 8;
const STRIP_SPAN = 0.27;
const STRIP_SPANS = [STRIP_SPAN, 0.22, 0.17];
const SWATCH_SPANS = [SWATCH_SPAN, 0.12, 0.09];
/** Brush strokes: a little over twice as wide as tall. */
const STROKE_ASPECT = 2.3;
export const STROKE_SPAN = 0.2;
const STROKE_SPANS = [STROKE_SPAN, 0.15, 0.11];
const PALETTE_SIZE = 4;

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
  return src ? [{ src, tone: product.color }] : [];
}

export function spotFocus(spot: MaterialSpot): TextureFocus {
  const point = { x: spot.x, y: spot.y, span: SWATCH_SPAN };
  return {
    swatch: point,
    strip: spot.span
      ? { ...point, span: Math.min(spot.span, STRIP_SPAN) }
      : undefined,
    palette: [
      { ...point, span: Math.min(spot.span ?? SWATCH_SPAN, STROKE_SPAN) },
    ],
  };
}

/** A coarse reading of a cut-out photo: opacity plus 0–1 RGB per cell. */
export type PhotoCells = {
  width: number;
  height: number;
  alpha: Uint8ClampedArray;
  rgb: Float32Array;
};

function hexRgb(hex?: string) {
  const match = hex?.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(
    (channel) => channel / 255,
  );
}

/** Hue in degrees, or null for greys whose hue means nothing. */
function hue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const chroma = max - Math.min(r, g, b);
  if (chroma < 0.04) return null;
  const sector =
    max === r
      ? ((g - b) / chroma + 6) % 6
      : max === g
        ? (b - r) / chroma + 2
        : (r - g) / chroma + 4;
  return sector * 60;
}

/** Summed-area table, so any window's total is four lookups. */
function integral(values: Float32Array, width: number, height: number) {
  const table = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1)
      table[(y + 1) * (width + 1) + x + 1] =
        values[y * width + x] +
        table[y * (width + 1) + x + 1] +
        table[(y + 1) * (width + 1) + x] -
        table[y * (width + 1) + x];
  return (x: number, y: number, w: number, h: number) =>
    table[(y + h) * (width + 1) + x + w] -
    table[y * (width + 1) + x + w] -
    table[(y + h) * (width + 1) + x] +
    table[y * (width + 1) + x];
}

/**
 * Finds where the photo shows the work's surface best: a window fully inside
 * the object, away from its fringe, even in light, free of glare and deep
 * shadow, rich in colour and close to the work's recorded tone. The strip
 * tries wide windows first, the swatch square ones.
 */
export function focusFromPhoto(
  { width, height, alpha, rgb }: PhotoCells,
  tone?: string,
): TextureFocus | null {
  const target = hexRgb(tone);
  const targetHue = target ? hue(target[0], target[1], target[2]) : null;
  const size = width * height;
  const core = new Float32Array(size);
  const light = new Float32Array(size);
  const lightSquared = new Float32Array(size);
  const chroma = new Float32Array(size);
  const glare = new Float32Array(size);
  const distance = new Float32Array(size);
  const opaque = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && alpha[y * width + x] > 200;

  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      core[index] =
        opaque(x, y) &&
        opaque(x - 1, y) &&
        opaque(x + 1, y) &&
        opaque(x, y - 1) &&
        opaque(x, y + 1)
          ? 1
          : 0;
      const [r, g, b] = rgb.subarray(index * 3, index * 3 + 3);
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const c = Math.max(r, g, b) - Math.min(r, g, b);
      light[index] = l;
      lightSquared[index] = l * l;
      chroma[index] = c;
      glare[index] = (l > 0.88 && c < 0.1) || l < 0.1 ? 1 : 0;
      if (targetHue === null) continue;
      const cellHue = hue(r, g, b);
      const turn =
        cellHue === null
          ? 90
          : Math.abs(((cellHue - targetHue + 540) % 360) - 180);
      distance[index] = turn / 180;
    }

  const channel = (offset: number) =>
    integral(
      rgb.filter((_, index) => index % 3 === offset),
      width,
      height,
    );
  const sums = {
    core: integral(core, width, height),
    light: integral(light, width, height),
    lightSquared: integral(lightSquared, width, height),
    chroma: integral(chroma, width, height),
    glare: integral(glare, width, height),
    distance: integral(distance, width, height),
    r: channel(0),
    g: channel(1),
    b: channel(2),
  };

  type Window = TexturePoint & {
    box: [number, number, number, number];
    surface: number;
    tone: number;
    colour: [number, number, number];
  };

  /** Every window of this shape lying fully on the object, with its reading. */
  const windows = (spans: number[], aspect: number) =>
    spans.flatMap((span, rank) => {
      const w = Math.max(2, Math.round(span * width));
      const h = Math.max(2, Math.round(w / aspect));
      const area = w * h;
      const found: Window[] = [];
      for (let y = 0; y + h <= height; y += 1)
        for (let x = 0; x + w <= width; x += 1) {
          if (sums.core(x, y, w, h) < area) continue;
          const mean = (sum: typeof sums.light) => sum(x, y, w, h) / area;
          const meanLight = mean(sums.light);
          const spread = Math.sqrt(
            Math.max(0, mean(sums.lightSquared) - meanLight ** 2),
          );
          found.push({
            x: ((x + w / 2) / width) * 100,
            y: ((y + h / 2) / height) * 100,
            span,
            box: [x, y, w, h],
            surface:
              0.6 * mean(sums.chroma) -
              1.5 * spread -
              2 * mean(sums.glare) -
              0.04 * rank,
            tone: mean(sums.distance),
            colour: [mean(sums.r), mean(sums.g), mean(sums.b)],
          });
        }
      return found;
    });

  const point = ({ x, y, span }: Window): TexturePoint => ({ x, y, span });
  const toneScore = (item: Window) => item.surface - 1.2 * item.tone;
  const best = (spans: number[], aspect: number) => {
    const found = windows(spans, aspect).reduce<Window | undefined>(
      (top, item) => (!top || toneScore(item) > toneScore(top) ? item : top),
      undefined,
    );
    return found && point(found);
  };

  /**
   * The work's own colour first, then the surfaces most unlike those already
   * chosen: a glaze, the bare body, a rim. Windows never overlap, and a
   * surface too close in colour to one already taken is left out.
   */
  const palette = () => {
    const candidates = windows(STROKE_SPANS, STROKE_ASPECT);
    const picks: Window[] = [];
    const overlaps = (a: Window, b: Window) =>
      a.box[0] < b.box[0] + b.box[2] &&
      b.box[0] < a.box[0] + a.box[2] &&
      a.box[1] < b.box[1] + b.box[3] &&
      b.box[1] < a.box[1] + a.box[3];
    const apart = (item: Window) =>
      Math.min(
        ...picks.map(
          (pick) =>
            Math.hypot(
              item.colour[0] - pick.colour[0],
              item.colour[1] - pick.colour[1],
              item.colour[2] - pick.colour[2],
            ) / Math.sqrt(3),
        ),
      );
    while (picks.length < PALETTE_SIZE) {
      let next: Window | undefined;
      let nextScore = -Infinity;
      for (const item of candidates) {
        if (picks.some((pick) => overlaps(item, pick))) continue;
        const gap = picks.length ? apart(item) : 0;
        if (picks.length && gap < 0.07) continue;
        const score = picks.length ? item.surface + 1.2 * gap : toneScore(item);
        if (score > nextScore) {
          next = item;
          nextScore = score;
        }
      }
      if (!next) break;
      picks.push(next);
    }
    return picks.map(point);
  };

  const strip = best(STRIP_SPANS, STRIP_ASPECT);
  const swatch = best(SWATCH_SPANS, 1);
  const colours = palette();
  return strip || swatch || colours.length
    ? { strip, swatch, palette: colours.length ? colours : undefined }
    : null;
}
