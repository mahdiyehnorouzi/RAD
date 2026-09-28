import { seedFor, seeded, smoothPath, TAU, type Point } from "./seeded";

/**
 * A loose pencil loop in a 200×100 box that overshoots its own start, drawn
 * a little differently for every work.
 */
export function handLoop(radNumber: number) {
  const next = seeded(seedFor(radNumber, 3));
  const start = Math.PI * (0.85 + next() * 0.3);
  const turn = TAU * (1.06 + next() * 0.08);
  const lean = (next() - 0.5) * 0.12;
  const points: Point[] = [];
  const steps = 26;
  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const angle = start + turn * progress;
    const wobble = 1 + (next() - 0.5) * 0.07;
    const drift = progress * (4 + next() * 3);
    const x = 100 + Math.cos(angle) * (94 - drift) * wobble;
    const y = 50 + Math.sin(angle + lean) * (44 - drift * 0.6) * wobble;
    points.push([x, y]);
  }
  return smoothPath(points, false);
}
