#!/usr/bin/env node
// Converts PNG/JPEG under a public folder to WebP in place and deletes the originals.
// Usage: node scripts/optimize-images.mjs [dir] [--dry-run]
// Update the code that points at the old file name afterwards; next.config.mjs
// redirects old .png/.jpg URLs (stored in the database) to the .webp file.
import { readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_SIDE = 2000;
// Browsers and app stores want these as PNG.
const KEEP = new Set(["rad-logo.png"]);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const root = path.resolve(args.find((a) => !a.startsWith("--")) ?? "apps/storefront/public");

async function* images(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* images(file);
    else if (/\.(png|jpe?g)$/i.test(entry.name) && !KEEP.has(entry.name)) yield file;
  }
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
let before = 0;
let after = 0;

for await (const file of images(root)) {
  const target = file.replace(/\.(png|jpe?g)$/i, ".webp");
  const input = sharp(file).rotate();
  const { width = 0, height = 0, hasAlpha } = await input.metadata();
  if (Math.max(width, height) > MAX_SIDE) {
    input.resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside" });
  }
  const output = await input
    .webp({ quality: hasAlpha ? 82 : 80, alphaQuality: 90, effort: 6, smartSubsample: true })
    .toBuffer();
  const original = (await stat(file)).size;
  before += original;
  after += output.length;
  console.log(`${kb(original).padStart(8)} -> ${kb(output.length).padStart(7)}  ${path.relative(root, target)}`);
  if (dryRun) continue;
  await writeFile(target, output);
  await unlink(file);
}

console.log(`\n${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
