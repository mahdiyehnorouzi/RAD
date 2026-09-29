// Torn slab masks for the QR page decoration: full on the left, torn down the right and across the foot.
import { writeFileSync, mkdirSync } from "node:fs";

let seed = 28;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const f = (n) => Number(n.toFixed(2));

function outline(inset) {
  const pts = [];
  let drift = 0;
  // right edge, top to bottom, wandering between ~74 and ~92
  for (let y = 0; y <= 88; y += 0.8 + rand() * 1.4) {
    drift = Math.max(-5, Math.min(5, drift + (rand() - 0.5) * 1.6));
    const bulge = 84 + Math.sin(y / 14) * 5 + drift;
    pts.push([bulge - inset + (rand() - 0.5) * 0.9, y]);
  }
  // torn foot, right to left, rising slightly toward the left edge
  for (let x = pts.at(-1)[0]; x >= 0; x -= 1 + rand() * 2.2) {
    const y = 90 + (x / 90) * 6 - inset + (rand() - 0.5) * 1.1;
    pts.push([x, Math.min(100, y)]);
  }
  pts.push([0, pts.at(-1)[1]]);
  return `M0 0L${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
}

const svg = (d) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="#fff" d="${d}"/></svg>`;

const dir = "apps/storefront/public/product-qr";
mkdirSync(dir, { recursive: true });
seed = 28;
const rim = outline(0);
seed = 28;
const slab = outline(1.6);
writeFileSync(`${dir}/slab-rim.svg`, svg(rim));
writeFileSync(`${dir}/slab.svg`, svg(slab));
console.log("ok", rim.length, slab.length);
