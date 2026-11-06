import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { analyzeSharedPackages } from "./check-shared-package-consumers.mjs";

function write(root, relative, contents) {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
}

function createRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rad-consumers-"));
  write(
    root,
    "package.json",
    JSON.stringify({ private: true, workspaces: ["apps/*", "packages/*"] }),
  );
  for (const [relative, contents] of Object.entries(files)) {
    write(root, relative, contents);
  }
  return root;
}

function packageManifest(name, extra = {}) {
  return JSON.stringify({ name, version: "0.0.0", private: true, ...extra });
}

function rowNamed(result, name) {
  const row = result.rows.find((item) => item.name === name);
  assert.ok(row, `missing row for ${name}`);
  return row;
}

test("a real import counts as a source consumer", () => {
  const root = createRepo({
    "packages/used/package.json": packageManifest("@rad/used"),
    "apps/web/package.json": packageManifest("@rad/web", {
      dependencies: { "@rad/used": "0.0.0" },
    }),
    "apps/web/src/index.ts":
      'import { item } from "@rad/used";\nexport const itemUsed = item;\n',
  });
  try {
    const result = analyzeSharedPackages(root, {});
    const row = rowNamed(result, "@rad/used");
    assert.deepEqual(row.source, ["apps/web"]);
    assert.deepEqual(row.dynamic, []);
    assert.deepEqual(row.manifest, ["apps/web"]);
    assert.deepEqual(result.failures, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a manifest-only dependency is not a source consumer", () => {
  const root = createRepo({
    "packages/declared/package.json": packageManifest("@rad/declared"),
    "apps/web/package.json": packageManifest("@rad/web", {
      dependencies: { "@rad/declared": "0.0.0" },
    }),
    "apps/web/src/index.ts": "export const local = 1;\n",
  });
  try {
    const result = analyzeSharedPackages(root, {});
    const row = rowNamed(result, "@rad/declared");
    assert.deepEqual(row.source, []);
    assert.deepEqual(row.dynamic, []);
    assert.deepEqual(row.manifest, ["apps/web"]);
    assert.deepEqual(result.failures, [
      "@rad/declared has no source import, re-export, or literal dynamic import outside packages/declared",
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a commented-out import does not count", () => {
  const root = createRepo({
    "packages/commented/package.json": packageManifest("@rad/commented"),
    "apps/web/package.json": packageManifest("@rad/web"),
    "apps/web/src/index.ts":
      '// import { item } from "@rad/commented";\n/* import "@rad/commented"; */\nexport const local = 1;\n',
  });
  try {
    const result = analyzeSharedPackages(root, {});
    const row = rowNamed(result, "@rad/commented");
    assert.deepEqual(row.source, []);
    assert.deepEqual(row.dynamic, []);
    assert.equal(result.failures.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a string mentioning an import does not count", () => {
  const root = createRepo({
    "packages/mentioned/package.json": packageManifest("@rad/mentioned"),
    "apps/web/package.json": packageManifest("@rad/web"),
    "apps/web/src/index.ts":
      'const note = "import { item } from \\"@rad/mentioned\\"";\nexport const text = note;\n',
  });
  try {
    const result = analyzeSharedPackages(root, {});
    const row = rowNamed(result, "@rad/mentioned");
    assert.deepEqual(row.source, []);
    assert.deepEqual(row.dynamic, []);
    assert.equal(result.failures.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a package subpath import counts as consumption of that package", () => {
  const root = createRepo({
    "packages/i18n/package.json": packageManifest("@rad/i18n"),
    "apps/web/package.json": packageManifest("@rad/web"),
    "apps/web/src/index.ts":
      'import { faCore } from "@rad/i18n/fa";\nexport const copy = faCore;\n',
  });
  try {
    const result = analyzeSharedPackages(root, {});
    const row = rowNamed(result, "@rad/i18n");
    assert.deepEqual(row.source, ["apps/web"]);
    assert.deepEqual(result.failures, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a package with no real consumers fails unless it is allowlisted", () => {
  const root = createRepo({
    "packages/orphan/package.json": packageManifest("@rad/orphan"),
    "packages/orphan/src/index.ts":
      'export const own = 1;\nimport "@rad/orphan/self";\n',
    "packages/state/package.json": packageManifest("@rad/state"),
    "apps/web/package.json": packageManifest("@rad/web"),
    "apps/web/src/index.ts": "export const local = 1;\n",
  });
  try {
    const result = analyzeSharedPackages(root, {
      "@rad/state": "fixture allowlist",
    });
    assert.deepEqual(rowNamed(result, "@rad/orphan").source, []);
    assert.deepEqual(rowNamed(result, "@rad/state").source, []);
    assert.equal(
      rowNamed(result, "@rad/state").allowReason,
      "fixture allowlist",
    );
    assert.deepEqual(result.failures, [
      "@rad/orphan has no source import, re-export, or literal dynamic import outside packages/orphan",
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an allowlisted package fails once a real consumer appears", () => {
  const root = createRepo({
    "packages/state/package.json": packageManifest("@rad/state"),
    "apps/web/package.json": packageManifest("@rad/web"),
    "apps/web/src/index.ts":
      'import { useCartStore } from "@rad/state";\nexport const store = useCartStore;\n',
  });
  try {
    const result = analyzeSharedPackages(root, {
      "@rad/state": "fixture allowlist",
    });
    assert.deepEqual(rowNamed(result, "@rad/state").source, ["apps/web"]);
    assert.deepEqual(result.failures, [
      "@rad/state is allowlisted as unused but has source or dynamic consumers: apps/web",
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("literal require counts as dynamic evidence and a computed import does not", () => {
  const root = createRepo({
    "packages/runtime/package.json": packageManifest("@rad/runtime"),
    "packages/computed/package.json": packageManifest("@rad/computed"),
    "services/auth/contracts.ts":
      'import type { Session } from "@rad/runtime";\nexport type AuthSession = Session;\n',
    "apps/web/package.json": packageManifest("@rad/web"),
    "apps/web/src/runtime.cjs":
      'const runtime = require("@rad/runtime");\nmodule.exports = runtime;\n',
    "apps/web/src/load.js":
      'export const load = () => import("@rad/runtime");\n',
    "apps/web/src/computed.js":
      'export async function load(name) { return import("@rad/" + name); }\n',
    "apps/Rad-App/src/app.ts": 'import "@rad/computed";\n',
  });
  try {
    const result = analyzeSharedPackages(root, {});
    const runtime = rowNamed(result, "@rad/runtime");
    assert.deepEqual(runtime.source, ["services/auth/contracts.ts"]);
    assert.deepEqual(runtime.dynamic, ["apps/web"]);
    assert.deepEqual(result.failures, [
      "@rad/computed has no source import, re-export, or literal dynamic import outside packages/computed",
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a re-export counts as a source consumer", () => {
  const root = createRepo({
    "packages/shared/package.json": packageManifest("@rad/shared"),
    "apps/web/package.json": packageManifest("@rad/web"),
    "apps/web/src/index.ts": 'export { item } from "@rad/shared";\n',
  });
  try {
    const result = analyzeSharedPackages(root, {});
    assert.deepEqual(rowNamed(result, "@rad/shared").source, ["apps/web"]);
    assert.deepEqual(result.failures, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
