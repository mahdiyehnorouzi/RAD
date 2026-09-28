import { seedFor, seeded, smoothPath, TAU, type Point } from "./seeded";

const SAMPLES = 48;

/**
 * Ridges of one work's print in a 100×100 box: an off-centre whorl whose
 * waves, tilt and broken ridges all come from the RAD number. Density only
 * changes how many ridges fill the same shape, so a small mark and a large
 * field are recognisably one print.
 */
export function fingerprintRidges(radNumber: number, ridges: number) {
  const seed = seedFor(radNumber);
  const shape = seeded(seed);
  const cx = 50 + (shape() - 0.5) * 12;
  const cy = 46 + (shape() - 0.5) * 12;
  const tilt = (shape() - 0.5) * 1.2;
  const squash = 0.7 + shape() * 0.16;
  const driftAngle = shape() * TAU;
  const drift = 0.2 + shape() * 0.35;
  const waves = [2, 3, 5].map((frequency) => ({
    frequency,
    amplitude: 0.015 + shape() * 0.045,
    phase: shape() * TAU,
    twist: (shape() - 0.5) * 0.7,
  }));
  const step = 52 / ridges;

  return Array.from({ length: ridges }, (_, ridge) => {
    const own = seeded(seed + (ridge + 1) * 7919);
    const base = step * (ridge + 0.9);
    const growth = 0.5 + (1.4 * ridge) / ridges;
    const shift = drift * step * ridge * 0.5;
    const ox = Math.cos(driftAngle) * shift;
    const oy = Math.sin(driftAngle) * shift;
    const broken = ridge > 0 && own() < 0.55;
    const gapAt = own() * TAU;
    const gap = broken ? 0.3 + own() * 0.6 : 0;
    const sweep = TAU - gap;
    const count = broken ? Math.round((SAMPLES * sweep) / TAU) : SAMPLES;
    const points: Point[] = [];
    for (let index = 0; index <= count; index += 1) {
      if (!broken && index === count) break;
      const angle = gapAt + gap / 2 + (sweep * index) / count;
      let radius = base;
      for (const wave of waves) {
        radius +=
          base *
          wave.amplitude *
          growth *
          Math.sin(
            wave.frequency * angle +
              wave.phase +
              (wave.twist * 14 * ridge) / ridges,
          );
      }
      const x = Math.cos(angle) * radius * squash;
      const y = Math.sin(angle) * radius;
      points.push([
        cx + ox + x * Math.cos(tilt) - y * Math.sin(tilt),
        cy + oy + x * Math.sin(tilt) + y * Math.cos(tilt),
      ]);
    }
    return smoothPath(points, !broken);
  });
}
