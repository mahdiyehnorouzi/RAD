// Usage: node crop-card-photo.mjs <src> <out> <degrees> <cx> <cy> <w> <h>
// Straightens a photographed card and keeps only the photo inside its paper edge.
import sharp from "sharp";

const [src, out, deg, cx, cy, w, h] = process.argv.slice(2);
const rotated = await sharp(src)
  .removeAlpha()
  .rotate(Number(deg), { background: "#ffffff" })
  .toBuffer({ resolveWithObject: true });
const input = await sharp(src).metadata();
const dx = (rotated.info.width - input.width) / 2;
const dy = (rotated.info.height - input.height) / 2;
await sharp(rotated.data)
  .extract({
    left: Math.round(dx + Number(cx) - Number(w) / 2),
    top: Math.round(dy + Number(cy) - Number(h) / 2),
    width: Number(w),
    height: Number(h),
  })
  .resize({ width: Number(w) * 2, kernel: "lanczos3" })
  .sharpen({ sigma: 0.8 })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(out);
console.log(out, Number(w) * 2);
