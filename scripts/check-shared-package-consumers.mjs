#!/usr/bin/env node
// Fails when a packages/* workspace has no real consumer outside itself.
// Knip treats package.json "exports" as a public entry, so an unused
// workspace does not show up as an unused file. This is the dead-package
// gate ADR-005 asks for.
//
// A consumer is a TypeScript/JavaScript module specifier found by the
// TypeScript parser already installed at the repo root:
//   - source: static import, export-from, import-equals, or import type
//   - dynamic: import(), require(), or require.resolve() with a literal
// A dependency declared in a manifest is reported separately and does not
// count. Comments and ordinary string literals are not specifiers.
// import() or require() whose argument is not a literal has no static
// evidence and does not count.
//
// apps/Rad-App is not an npm workspace and is not scanned. Its isolation
// rule stays in apps/Rad-App/scripts/check-isolation.mjs.
//
// Allowlist entries are known unused packages that must not be deleted in
// this change. A listed package that gains a source or dynamic consumer
// fails until the entry is removed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

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

export const allowUnused = {
  "@rad/state":
    "ADR-005 confirmed zero consumers. Deletion is a separate Tech Lead decision (REF-005b). Remove this entry when the package is deleted or a real consumer lands.",
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function expandWorkspaces(repoRoot, patterns) {
  const dirs = [];
  for (const pattern of patterns) {
    if (!pattern.includes("*")) {
      dirs.push(slash(pattern));
      continue;
    }
    const prefix = pattern.slice(0, pattern.indexOf("*"));
    const parent = path.join(repoRoot, prefix);
    if (!fs.existsSync(parent)) continue;
    for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      dirs.push(slash(path.join(prefix, entry.name)));
    }
  }
  return dirs.filter((dir) =>
    fs.existsSync(path.join(repoRoot, dir, "package.json")),
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
    (dir) => relativeFile === dir || relativeFile.startsWith(`${dir}/`),
  );
  matches.sort((a, b) => b.length - a.length);
  return matches[0] ?? null;
}

function walkSources(dir, relativeDir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirectories.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    const relative = slash(path.join(relativeDir, entry.name));
    if (entry.isDirectory()) {
      walkSources(absolute, relative, files);
      continue;
    }
    if (sourceExtensions.has(path.extname(entry.name))) files.push(relative);
  }
}

function scriptKind(file) {
  switch (path.extname(file)) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function literalText(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
}

function moduleSpecifier(node) {
  const text = literalText(node);
  return text && text.length > 0 ? text : null;
}

function recordSpecifier(target, node) {
  const text = moduleSpecifier(node);
  if (text) target.push(text);
}

function collectSpecifiers(file, source) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    false,
    scriptKind(file),
  );
  const staticSpecifiers = [];
  const dynamicSpecifiers = [];

  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      recordSpecifier(staticSpecifiers, node.moduleSpecifier);
    } else if (ts.isExportDeclaration(node)) {
      recordSpecifier(staticSpecifiers, node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      recordSpecifier(staticSpecifiers, node.moduleReference.expression);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument)
    ) {
      recordSpecifier(staticSpecifiers, node.argument.literal);
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isDynamicImport = callee.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(callee) && callee.text === "require";
      const isRequireResolve =
        ts.isPropertyAccessExpression(callee) &&
        callee.name.text === "resolve" &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === "require";
      if (isDynamicImport || isRequire || isRequireResolve) {
        recordSpecifier(dynamicSpecifiers, node.arguments[0]);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { staticSpecifiers, dynamicSpecifiers };
}

function matchesPackage(specifier, packageName) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}

function locationOf(file, workspaceDirs) {
  return workspaceOf(file, workspaceDirs) ?? file;
}

function sorted(values) {
  return [...values].sort();
}

export function analyzeSharedPackages(repoRoot, allow = allowUnused) {
  const rootManifest = readJson(path.join(repoRoot, "package.json"));
  const workspaceDirs = expandWorkspaces(
    repoRoot,
    rootManifest.workspaces ?? [],
  );
  const manifests = new Map(
    workspaceDirs.map((dir) => [
      dir,
      readJson(path.join(repoRoot, dir, "package.json")),
    ]),
  );
  const sharedDirs = workspaceDirs
    .filter((dir) => dir.startsWith("packages/"))
    .sort();
  const sourceFiles = [];
  walkSources(repoRoot, "", sourceFiles);

  const parsed = sourceFiles.map((file) => ({
    file,
    ...collectSpecifiers(
      file,
      fs.readFileSync(path.join(repoRoot, file), "utf8"),
    ),
  }));

  const rows = [];
  const failures = [];
  for (const dir of sharedDirs) {
    const name = manifests.get(dir).name;
    const source = new Set();
    const dynamic = new Set();
    for (const file of parsed) {
      if (file.file === dir || file.file.startsWith(`${dir}/`)) continue;
      const where = locationOf(file.file, workspaceDirs);
      if (
        file.staticSpecifiers.some((specifier) =>
          matchesPackage(specifier, name),
        )
      ) {
        source.add(where);
      }
      if (
        file.dynamicSpecifiers.some((specifier) =>
          matchesPackage(specifier, name),
        )
      ) {
        dynamic.add(where);
      }
    }
    const declared = new Set();
    for (const other of workspaceDirs) {
      if (other === dir) continue;
      if (dependencyNames(manifests.get(other)).includes(name))
        declared.add(other);
    }

    const row = {
      name,
      directory: dir,
      source: sorted(source),
      dynamic: sorted(dynamic),
      manifest: sorted(declared),
      allowReason: allow[name] ?? null,
    };
    rows.push(row);

    const genuine = sorted(new Set([...row.source, ...row.dynamic]));
    if (genuine.length === 0 && row.allowReason) continue;
    if (genuine.length === 0) {
      failures.push(
        `${name} has no source import, re-export, or literal dynamic import outside ${dir}`,
      );
      continue;
    }
    if (row.allowReason) {
      failures.push(
        `${name} is allowlisted as unused but has source or dynamic consumers: ${genuine.join(", ")}`,
      );
    }
  }

  return { rows, failures };
}

function list(values) {
  return values.length > 0 ? values.join(", ") : "none";
}

export function formatReport(rows) {
  const lines = [
    "Shared package consumers (apps/Rad-App excluded; a manifest entry is not consumption):",
  ];
  for (const row of rows) {
    lines.push(`  ${row.name}`);
    lines.push(`    source: ${list(row.source)}`);
    lines.push(`    dynamic: ${list(row.dynamic)}`);
    lines.push(`    manifest: ${list(row.manifest)}`);
    if (
      row.allowReason &&
      row.source.length === 0 &&
      row.dynamic.length === 0
    ) {
      lines.push(`    allowed: ${row.allowReason}`);
    }
  }
  return lines.join("\n");
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const { rows, failures } = analyzeSharedPackages(repoRoot);
  console.log(formatReport(rows));
  if (failures.length > 0) {
    console.error("\nShared package consumer check failed:");
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
}
