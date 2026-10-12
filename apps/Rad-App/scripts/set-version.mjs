/**
 * Sets the app version on iOS and Android together.
 *
 *   npm run version:set -- 1.2.0       # build number = current + 1
 *   npm run version:set -- 1.2.0 15    # explicit build number
 *   npm run version:set                # print the current version
 *
 * iOS: MARKETING_VERSION / CURRENT_PROJECT_VERSION in the Xcode project.
 * Android: versionName / versionCode in android/app/build.gradle.
 * Store flavor suffixes (-CB, -MK) are added by Gradle on top of versionName.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pbxproj = path.join(appDir, "ios/Rad.xcodeproj/project.pbxproj");
const gradle = path.join(appDir, "android/app/build.gradle");

const ios = readFileSync(pbxproj, "utf8");
const android = readFileSync(gradle, "utf8");

const current = {
  version: /versionName "([^"]+)"/.exec(android)?.[1],
  build: Number(/versionCode (\d+)/.exec(android)?.[1]),
  iosVersion: /MARKETING_VERSION = ([^;]+);/.exec(ios)?.[1],
  iosBuild: Number(/CURRENT_PROJECT_VERSION = (\d+);/.exec(ios)?.[1]),
};

const [version, buildArg] = process.argv.slice(2);
if (!version) {
  console.log(`Android ${current.version} (${current.build}), iOS ${current.iosVersion} (${current.iosBuild})`);
  process.exit(0);
}

if (!/^\d+\.\d+(\.\d+)?$/.test(version)) {
  console.error(`Version must look like 1.2 or 1.2.3, got "${version}".`);
  process.exit(1);
}
const build = buildArg ? Number(buildArg) : Math.max(current.build, current.iosBuild) + 1;
if (!Number.isInteger(build) || build < 1) {
  console.error(`Build number must be a positive integer, got "${buildArg}".`);
  process.exit(1);
}
if (build <= Math.max(current.build, current.iosBuild)) {
  console.warn(`Warning: build ${build} is not higher than the current one; stores reject non-increasing builds.`);
}

writeFileSync(
  pbxproj,
  ios
    .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
    .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${build};`),
);
writeFileSync(
  gradle,
  android
    .replace(/versionName "[^"]+"/, `versionName "${version}"`)
    .replace(/versionCode \d+/, `versionCode ${build}`),
);

console.log(`Set version ${version} (build ${build}) for iOS and Android.`);
