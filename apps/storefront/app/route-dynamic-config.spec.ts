import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

// Lives outside `[locale]` deliberately: the test runner's glob matching
// treats `[locale]` as a bracket character class (so it can never match
// the literal directory name), meaning a spec file placed inside that
// directory is silently never collected by `npm run test`'s file list.
// Reading the route files' source text (rather than importing them, or
// using fileURLToPath to reach into `[locale]`) sidesteps that for the
// one thing worth guarding here: the `dynamic` route segment config.
function dynamicExportOf(routeFile: string): string {
  const source = readFileSync(
    fileURLToPath(new URL(`./[locale]/${routeFile}`, import.meta.url)),
    "utf8",
  );
  const match = source.match(/export const dynamic = (["'])([^"']+)\1/);
  return match?.[2] ?? "";
}

test("cart layout opts out of static prerendering", () => {
  assert.equal(
    dynamicExportOf("cart/layout.tsx"),
    "force-dynamic",
    "without this, `next build` can prerender /cart once using whatever catalog " +
      "origin (possibly the stale bundled registry, see catalogSource()) was " +
      "reachable at build time, bake it into a permanently static page " +
      "(revalidate: false — no live fetch call was made during generation, so " +
      "Next infers no revalidate window), and serve that snapshot to every " +
      "customer afterward regardless of the real catalog",
  );
});

test("checkout layout opts out of static prerendering, same reasoning as /cart", () => {
  assert.equal(dynamicExportOf("checkout/layout.tsx"), "force-dynamic");
});
