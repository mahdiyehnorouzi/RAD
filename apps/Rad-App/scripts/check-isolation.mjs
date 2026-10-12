/**
 * Builds the production JS bundle for both platforms and fails if any module
 * in it comes from outside this app (web apps, packages/*, root node_modules).
 *
 *   npm run check:isolation
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = mkdtempSync(path.join(tmpdir(), "rad-app-bundle-"));
let failed = false;

try {
  for (const platform of ["ios", "android"]) {
    const bundle = path.join(outDir, `${platform}.js`);
    const map = path.join(outDir, `${platform}.map`);
    execFileSync(
      "npx",
      ["react-native", "bundle", "--platform", platform, "--dev", "false", "--minify", "true",
        "--entry-file", "index.js", "--bundle-output", bundle, "--sourcemap-output", map,
        "--assets-dest", path.join(outDir, `${platform}-assets`)],
      { cwd: appDir, stdio: "ignore" },
    );

    const sourceMap = JSON.parse(readFileSync(map, "utf8"));
    const sources = (sourceMap.sections
      ? sourceMap.sections.flatMap((s) => s.map.sources)
      : sourceMap.sources
    ).filter((s) => s !== "__prelude__" && !s.startsWith("require-"));
    const outside = sources.filter(
      (s) => !path.resolve(appDir, s).startsWith(appDir + path.sep),
    );

    const kb = (statSync(bundle).size / 1024).toFixed(0);
    console.log(`${platform}: ${sources.length} modules, ${kb} KB, ${outside.length} from outside the app`);
    if (outside.length) {
      failed = true;
      for (const s of outside) console.error(`  ${s}`);
    }
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

if (failed) {
  console.error("Bundle includes files from outside apps/Rad-App.");
  process.exit(1);
}
