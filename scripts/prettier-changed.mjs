#!/usr/bin/env node
/**
 * Runs Prettier only on files changed since the merge base with BASE_REF
 * (default `origin/main`), plus uncommitted and untracked files.
 *
 *   node scripts/prettier-changed.mjs --check   # CI
 *   node scripts/prettier-changed.mjs --write   # fix before pushing
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const mode = process.argv.includes("--write") ? "--write" : "--check";
const base = process.env.BASE_REF || "origin/main";
const extensions = /\.(ts|tsx|js|jsx|mjs|cjs|css|json|ya?ml)$/;

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);

const root = git("rev-parse", "--show-toplevel")[0];
process.chdir(root);

const mergeBase = git("merge-base", base, "HEAD")[0];
const files = [
  ...new Set([
    ...git("diff", "--name-only", "--diff-filter=ACMR", mergeBase),
    ...git("ls-files", "--others", "--exclude-standard"),
  ]),
].filter((file) => extensions.test(file) && existsSync(file));

if (!files.length) {
  console.log(`No changed files to format since ${base}.`);
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["prettier", mode, "--ignore-unknown", "--", ...files],
  { stdio: "inherit" },
);
if (result.status !== 0 && mode === "--check") {
  console.error("\nRun `npm run format:changed` to format these files.");
}
process.exit(result.status ?? 1);
