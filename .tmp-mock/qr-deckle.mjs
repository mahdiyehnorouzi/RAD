// A crisp deckled label outline: straight-ish edges with fine torn fibre and softly nicked corners.
import { writeFileSync } from "node:fs";

let seed = 60;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const f = (n) => Number(n.toFixed(2));
const pts = [];
const edge = (from, to, fixed, horizontal, inward) => {
  const step = from < to ? 1 : -1;
  for (let t = from; step > 0 ? t <= to : t >= to; t += step * (0.6 + rand() * 1.1)) {
    const d = 0.35 + rand() * 0.9;
    const v = fixed + inward * d;
    pts.push(horizontal ? [t, v] : [v, t]);
  }
};
edge(1.2, 98.8, 0, true, 1);
edge(1.2, 98.8, 100, false, -1);
edge(98.8, 1.2, 100, true, -1);
edge(98.8, 1.2, 0, false, 1);
const d = `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
writeFileSync(
  "apps/storefront/public/product-qr/label-deckle.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="#fff" d="${d}"/></svg>`,
);
console.log("ok", d.length);
