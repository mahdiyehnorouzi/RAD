import sharp from "sharp";

const src = "apps/storefront/public/rad-logo.png";
const out = "apps/storefront/public/rad-mark.png";

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const ink = [0x37, 0x4a, 0x3e];
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const bg = lum(data[0], data[1], data[2]);
const fg = lum(...ink);
for (let i = 0; i < data.length; i += 4) {
  const a = Math.max(0, Math.min(1, (bg - lum(data[i], data[i + 1], data[i + 2])) / (bg - fg)));
  data[i] = ink[0];
  data[i + 1] = ink[1];
  data[i + 2] = ink[2];
  data[i + 3] = Math.round(a * 255);
}
await sharp(data, { raw: info })
  .trim({ threshold: 10 })
  .resize(224, 224, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(out);
console.log("wrote", out);
