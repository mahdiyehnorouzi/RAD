export const TAU = Math.PI * 2;

export type Point = [number, number];

/** Deterministic 0–1 stream; the same seed always draws the same work. */
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFor(radNumber: number, salt = 0) {
  return Math.imul(Math.max(1, radNumber) + salt * 1013, 2654435761);
}

const round = (value: number) => Math.round(value * 10) / 10;

/** Catmull-Rom through every point, written as cubic Béziers. */
export function smoothPath(points: Point[], closed: boolean) {
  const count = points.length;
  const at = (index: number) =>
    closed
      ? points[(index + count) % count]
      : points[Math.max(0, Math.min(count - 1, index))];
  let path = `M${round(points[0][0])} ${round(points[0][1])}`;
  const segments = closed ? count : count - 1;
  for (let index = 0; index < segments; index += 1) {
    const [p0, p1, p2, p3] = [
      at(index - 1),
      at(index),
      at(index + 1),
      at(index + 2),
    ];
    path +=
      `C${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)}` +
      ` ${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(p2[1] - (p3[1] - p1[1]) / 6)}` +
      ` ${round(p2[0])} ${round(p2[1])}`;
  }
  return closed ? `${path}Z` : path;
}
