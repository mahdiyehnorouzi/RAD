import type { CSSProperties } from "react";

type CardMediaFit = {
  scale: number;
  hoverScale: number;
  y: string;
};

const CARD_MEDIA_FIT: Record<string, CardMediaFit> = {
  "woven-garden": { scale: 0.9, hoverScale: 0.94, y: "2%" },
  "blue-flower-portrait": { scale: 0.92, hoverScale: 0.96, y: "0%" },
  "olive-loop-vessel": { scale: 1, hoverScale: 1.04, y: "-2%" },
  "mint-loop-vessel": { scale: 1, hoverScale: 1.04, y: "-2%" },
  "spotted-loop-teapot": { scale: 0.96, hoverScale: 1, y: "0%" },
  "walnut-tide": { scale: 0.9, hoverScale: 0.94, y: "0%" },
  "cobalt-ripple-tray": { scale: 0.9, hoverScale: 0.94, y: "0%" },
  "cobalt-fold-bowl": { scale: 0.92, hoverScale: 0.96, y: "0%" },
  "orange-boat-sculpture": { scale: 0.9, hoverScale: 0.94, y: "0%" },
  "cat-cup": { scale: 1.02, hoverScale: 1.06, y: "-2%" },
  "dachshund-sculpture": { scale: 0.92, hoverScale: 0.96, y: "0%" },
};

export function cardMediaStyle(
  slug: string,
  extras: CSSProperties,
): CSSProperties {
  const fit = CARD_MEDIA_FIT[slug];
  if (!fit) return extras;
  return {
    ...extras,
    "--card-cutout-scale": String(fit.scale),
    "--card-cutout-hover-scale": String(fit.hoverScale),
    "--card-cutout-y": fit.y,
  } as CSSProperties;
}
