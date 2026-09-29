import sharp from "sharp";
import { mkdirSync } from "node:fs";

const pub = "/Users/mahdiyeh/Desktop/projects/RAD/apps/storefront/public";
const out = `${pub}/studio`;
mkdirSync(out, { recursive: true });

const pieces = {
  lamp: `${pub}/catalog/graphic/orbit-sculpture-lamp.png`,
  dog: `${pub}/catalog/photos/transparent/dachshund-sculpture.png`,
  mug: `${pub}/catalog/photos/transparent/croissant-handle-mug.png`,
};

async function piece(file, width, erode = 1) {
  const trimmed = await sharp(file).trim({ threshold: 8 }).toBuffer();
  const { data, info } = await sharp(trimmed)
    .resize({ width })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let min = 255;
      for (let dy = -erode; dy <= erode; dy++) {
        for (let dx = -erode; dx <= erode; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          const a = xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : alpha[yy * w + xx];
          if (a < min) min = a;
        }
      }
      const i = (y * w + x) * 4;
      data[i + 3] = min;
      data[i] = Math.min(255, data[i] * 0.99 + 4);
      data[i + 1] = Math.min(255, data[i + 1] * 0.955 + 2);
      data[i + 2] = data[i + 2] * 0.87;
    }
  }
  const buf = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .blur(0.4)
    .png()
    .toBuffer();
  return { buf, w, h };
}

function shadow(w, h, opacity) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 1.6}" height="${h * 4}">
    <defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${h * 0.45}"/></filter></defs>
    <ellipse cx="${w * 0.8}" cy="${h * 2}" rx="${w / 2}" ry="${h / 2}" fill="rgb(70,48,28)" fill-opacity="${opacity}" filter="url(#b)"/>
  </svg>`;
  return Buffer.from(svg);
}

async function compose(scene, target, items, floor = 0) {
  const layers = [];
  for (const it of items) {
    const p = await piece(pieces[it.id], it.width, it.erode ?? 1);
    const top = Math.round(it.base - p.h);
    const sw = Math.round(p.w * (it.shadowW ?? 0.9));
    const sh = Math.round(it.shadowH ?? 18);
    layers.push({
      input: shadow(sw, sh, it.shadowO ?? 0.42),
      left: Math.round(it.left + p.w / 2 - sw * 0.8),
      top: Math.round(it.base - sh * 2 - 2),
      blend: "multiply",
    });
    layers.push({ input: p.buf, left: Math.round(it.left), top });
  }
  const base = floor
    ? await sharp(scene).extend({ bottom: floor, extendWith: "mirror" }).toBuffer()
    : scene;
  await sharp(base)
    .composite(layers)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(target);
}

await compose(`${pub}/home/hero/scene-tall.jpg`, `${out}/hero-tall.jpg`, [
  { id: "lamp", width: 268, left: 96, base: 944, shadowW: 0.7, erode: 3 },
  { id: "mug", width: 206, left: 452, base: 958, shadowW: 0.62 },
  { id: "dog", width: 300, left: 150, base: 984, shadowW: 0.82, shadowH: 14 },
], 190);

await compose(`${pub}/home/hero/scene-wide.jpg`, `${out}/hero-wide.jpg`, [
  { id: "lamp", width: 250, left: 300, base: 522, shadowW: 0.7, shadowH: 14, erode: 3 },
  { id: "mug", width: 188, left: 640, base: 522, shadowW: 0.62, shadowH: 12 },
  { id: "dog", width: 296, left: 380, base: 532, shadowW: 0.82, shadowH: 10 },
]);

console.log("done");
