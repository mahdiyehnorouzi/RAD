#!/usr/bin/env node
// Fails when a packages/* workspace has no consumer outside itself.
// Knip treats package.json "exports" as a public entry, so an unused
// workspace does not show up as an unused file. This check is the
// dead-package gate ADR-005 asks for.
//
// apps/Rad-App is not an npm workspace and is not scanned. Its isolation
// rule stays in apps/Rad-App/scripts/check-isolation.mjs.
//
// Allowlist entries are known unused packages that must not be deleted in
// this change. A listed package that gains a consumer fails until the
// entry is removed.

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const skipDirectories = new Set([
  "node_modules",
  "dist",
  ".next",
  "out",
  "build",
  "coverage",
  ".turbo",
  ".git",
  "Rad-App",
]);
const sourceExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const allowUnused = {
  "@rad/state":
    "ADR-005 confirmed zero consumers. Deletion is a separate Tech Lead decision (REF-005b). Remove this entry when the package is deleted or a real consumer lands.",
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function expandWorkspaces(patterns) {
  const dirs = [];
  for (const pattern of patterns) {
    if (!pattern.includes("*")) {
      dirs.push(pattern);
      continue;
    }
    const star = pattern.indexOf("*");
    const prefix = pattern.slice(0, star);
    const parent = path.join(root, prefix);
    for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      dirs.push(path.join(prefix, entry.name));
    }
  }
  return dirs.filter((dir) =>
    fs.existsSync(path.join(root, dir, "package.json")),
  );
}

function dependencyNames(manifest) {
  const names = [];
  for (const field of dependencyFields) {
    names.push(...Object.keys(manifest[field] ?? {}));
  }
  return names;
}

function workspaceOf(relativeFile, workspaceDirs) {
  const matches = workspaceDirs.filter(
    (dir) => relativeFile === dir || relativeFile.startsWith(dir + "/"),
  );
  matches.sort((a, b) => b.length - a.length);
  return matches[0] ?? null;
}

function walkSources(dir, relativeDir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirectories.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    const relative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      walkSources(absolute, relative, files);
      continue;
    }
    if (!sourceExtensions.has(path.extname(entry.name))) continue;
    if (relative === path.join("scripts", "check-shared-package-consumers.mjs"))
      continue;
    files.push(relative);
  }
}

function importsPackage(source, name) {
  const specifier = `${name}(?:/[^'"]*)?`;
  const pattern = new RegExp(
    `(?:import|export)[\\s\\S]{0,500}?['"]${specifier}['"]|require\\s*\\(\\s*['"]${specifier}['"]`,
  );
  return pattern.test(source);
}

const rootManifest = readJson(path.join(root, "package.json"));
const workspaceDirs = expandWorkspaces(rootManifest.workspaces ?? []);
const manifests = new Map(
  workspaceDirs.map((dir) => [
    dir,
    readJson(path.join(root, dir, "package.json")),
  ]),
);
const sharedDirs = workspaceDirs.filter((dir) => dir.startsWith("packages/"));
const sourceFiles = [];
walkSources(root, "", sourceFiles);

const failures = [];
console.log("Shared package consumers (apps/Rad-App excluded):");

for (const dir of sharedDirs.sort()) {
  const name = manifests.get(dir).name;
  const consumers = new Set();
  for (const other of workspaceDirs) {
    if (other === dir) continue;
    if (dependencyNames(manifests.get(other)).includes(name))
      consumers.add(other);
  }
  for (const file of sourceFiles) {
    if (file === dir || file.startsWith(dir + "/")) continue;
    const source = fs.readFileSync(path.join(root, file), "utf8");
    if (!importsPackage(source, name)) continue;
    consumers.add(workspaceOf(file, workspaceDirs) ?? file);
  }

  const listed = [...consumers].sort();
  const reason = allowUnused[name];
  if (listed.length === 0 && reason) {
    console.log(`  ${name}: 0 consumers (allowed)`);
    console.log(`    ${reason}`);
    continue;
  }
  if (listed.length === 0) {
    failures.push(`${name} has no consumer outside ${dir}`);
    console.log(`  ${name}: 0 consumers`);
    continue;
  }
  if (reason) {
    failures.push(
      `${name} is allowlisted as unused but has consumers: ${listed.join(", ")}`,
    );
  }
  console.log(`  ${name}: ${listed.length} (${listed.join(", ")})`);
}

if (failures.length > 0) {
  console.error("\nShared package consumer check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
