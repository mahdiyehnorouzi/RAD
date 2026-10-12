/**
 * Generates app icons and splash artwork from the storefront's brand logo
 * (apps/storefront/public/rad-logo.png) so the native app matches the web.
 *
 * Uses `sharp` from the monorepo root node_modules:
 *   npm run assets   (from Rad-App)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(appDir, "../apps/storefront/public/rad-logo.png");

// Sampled from rad-logo.png: cream paper and the green mark.
const LOGO_BG = { r: 242, g: 232, b: 219 };
const MARK = { r: 53, g: 70, b: 59 };
// Web canvas token (--canvas in apps/storefront/styles/tokens.css).
const CANVAS = "#eee7dc";

const lum = ({ r, g, b }) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Cuts the mark out of the cream background into a tightly cropped transparent PNG. */
async function extractMark() {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bgL = lum(LOGO_BG);
  const markL = lum(MARK);
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const l = lum({ r: data[i], g: data[i + 1], b: data[i + 2] });
    const a = Math.max(0, Math.min(1, (bgL - l) / (bgL - markL)));
    out[i] = MARK.r;
    out[i + 1] = MARK.g;
    out[i + 2] = MARK.b;
    out[i + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: info }).png().trim().toBuffer();
}

/** Places the mark centered on a square canvas, scaled to `ratio` of its width. */
async function markOnSquare(mark, size, ratio, background) {
  const inner = Math.round(size * ratio);
  const resized = await sharp(mark)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toBuffer();
}

async function write(rel, buffer) {
  const file = path.join(appDir, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
}

const circleMask = (size) =>
  Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`,
  );

async function main() {
  const mark = await extractMark();

  // JS splash overlay (src/assets), 1x/2x/3x of a 120pt mark.
  for (const [suffix, scale] of [["", 1], ["@2x", 2], ["@3x", 3]]) {
    const size = 120 * scale;
    await write(
      `src/assets/rad-mark${suffix}.png`,
      await sharp(mark).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    );
  }

  // iOS launch screen image set (same 120pt mark).
  const iosSplash = "ios/Rad/Images.xcassets/SplashLogo.imageset";
  for (const [suffix, scale] of [["", 1], ["@2x", 2], ["@3x", 3]]) {
    const size = 120 * scale;
    await write(
      `${iosSplash}/splash-logo${suffix}.png`,
      await sharp(mark).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    );
  }
  await write(
    `${iosSplash}/Contents.json`,
    JSON.stringify(
      {
        images: [
          { idiom: "universal", filename: "splash-logo.png", scale: "1x" },
          { idiom: "universal", filename: "splash-logo@2x.png", scale: "2x" },
          { idiom: "universal", filename: "splash-logo@3x.png", scale: "3x" },
        ],
        info: { author: "xcode", version: 1 },
      },
      null,
      2,
    ) + "\n",
  );

  // iOS app icon: single 1024 universal icon, opaque (App Store rejects alpha).
  const iosIcon = "ios/Rad/Images.xcassets/AppIcon.appiconset";
  await write(
    `${iosIcon}/AppIcon-1024.png`,
    await sharp(await markOnSquare(mark, 1024, 0.5, CANVAS)).flatten({ background: CANVAS }).removeAlpha().png().toBuffer(),
  );
  await write(
    `${iosIcon}/Contents.json`,
    JSON.stringify(
      {
        images: [
          { filename: "AppIcon-1024.png", idiom: "universal", platform: "ios", size: "1024x1024" },
        ],
        info: { author: "xcode", version: 1 },
      },
      null,
      2,
    ) + "\n",
  );

  // Android densities.
  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [name, scale] of Object.entries(densities)) {
    const legacy = Math.round(48 * scale);
    const square = await markOnSquare(mark, legacy, 0.5, CANVAS);
    await write(`android/app/src/main/res/mipmap-${name}/ic_launcher.png`, square);
    await write(
      `android/app/src/main/res/mipmap-${name}/ic_launcher_round.png`,
      await sharp(square).composite([{ input: circleMask(legacy), blend: "dest-in" }]).png().toBuffer(),
    );
    // Adaptive icon foreground: 108dp canvas, content kept inside the 66dp safe zone.
    const fg = Math.round(108 * scale);
    await write(
      `android/app/src/main/res/mipmap-${name}/ic_launcher_foreground.png`,
      await markOnSquare(mark, fg, 0.42),
    );
    // Splash mark: 120dp for the pre-Android-12 window background.
    const splash = Math.round(120 * scale);
    await write(
      `android/app/src/main/res/drawable-${name}/splash_logo.png`,
      await sharp(mark).resize(splash, splash, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    );
    // Android 12+ splash icon: 288dp canvas, content must fit the 192dp circle.
    const sys = Math.round(288 * scale);
    await write(
      `android/app/src/main/res/drawable-${name}/splash_icon.png`,
      await markOnSquare(mark, sys, 0.42),
    );
  }

  console.log("Assets generated.");
}

await main();
