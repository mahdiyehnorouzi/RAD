// Usage: node hand-ink.mjs <src> <out> [left top width height]
// Lifts pen ink off cream paper into a transparent PNG in one ink colour.
import sharp from "sharp";

const [src, out, ...box] = process.argv.slice(2);
let img = sharp(src);
if (box.length === 4) {
  const [left, top, width, height] = box.map(Number);
  img = img.extract({ left, top, width, height });
}
const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const ink = [0x2b, 0x27, 0x22];
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const samples = [];
for (let i = 0; i < data.length; i += 4 * 37) samples.push(lum(data[i], data[i + 1], data[i + 2]));
samples.sort((a, b) => a - b);
const paper = samples[Math.floor(samples.length * 0.6)];
const dark = samples[Math.floor(samples.length * 0.004)];

for (let i = 0; i < data.length; i += 4) {
  const t = (paper - 8 - lum(data[i], data[i + 1], data[i + 2])) / (paper - 8 - dark);
  const a = Math.max(0, Math.min(1, t)) ** 0.85;
  data[i] = ink[0];
  data[i + 1] = ink[1];
  data[i + 2] = ink[2];
  data[i + 3] = Math.round(a * 255);
}
await sharp(data, { raw: info }).trim({ threshold: 6 }).png({ compressionLevel: 9 }).toFile(out);
const meta = await sharp(out).metadata();
console.log(out, meta.width, meta.height, { paper, dark });
