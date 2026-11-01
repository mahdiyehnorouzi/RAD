#!/usr/bin/env node
// Read-only check. Every directory named rad-* must be a real SKILL.md
// copy, byte-identical in .claude/skills (canonical), .agents/skills, and
// .cursor/skills. Other skills are ignored. No installs and no writes.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const locations = [".claude/skills", ".agents/skills", ".cursor/skills"];
const canonical = locations[0];
const errors = [];
const blockScalars = new Set([">", ">-", "|", "|-", "|+"]);

function fail(message) {
  errors.push(message);
}

function listRadSkills(dir) {
  const absolute = path.join(root, dir);
  let entries;
  try {
    if (!fs.existsSync(absolute)) {
      fail("Missing skill directory: " + dir);
      return [];
    }
    entries = fs.readdirSync(absolute, { withFileTypes: true });
  } catch (error) {
    fail("Cannot read skill directory " + dir + ": " + error.message);
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("rad-"))
    .map((entry) => entry.name);
}

function readSkill(file) {
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) {
      fail("Skill file is a symlink, not a copy: " + path.relative(root, file));
      return null;
    }
    if (!stat.isFile()) {
      fail("Skill path is not a file: " + path.relative(root, file));
      return null;
    }
    return fs.readFileSync(file);
  } catch (error) {
    fail("Cannot read " + path.relative(root, file) + ": " + error.message);
    return null;
  }
}

function field(lines, key) {
  const index = lines.findIndex((line) => line.startsWith(key + ":"));
  if (index < 0) return "";
  const raw = lines[index]
    .slice(key.length + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "");
  if (raw !== "" && !blockScalars.has(raw)) return raw;
  const parts = [];
  for (let i = index + 1; i < lines.length; i += 1) {
    if (lines[i] === "") continue;
    if (!/^\s/.test(lines[i])) break;
    parts.push(lines[i].trim());
  }
  return parts.join(" ").trim();
}

const skillNames = new Set(locations.flatMap(listRadSkills));
if (!skillNames.has("rad-safe-refactor")) {
  fail("Required skill rad-safe-refactor is missing.");
}

for (const skill of [...skillNames].sort()) {
  const canonicalPath = path.join(root, canonical, skill, "SKILL.md");
  const bytes = fs.existsSync(canonicalPath) ? readSkill(canonicalPath) : null;
  if (!fs.existsSync(canonicalPath)) {
    fail("Missing canonical skill: " + path.relative(root, canonicalPath));
  } else if (bytes) {
    const frontmatter = bytes
      .toString("utf8")
      .match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const lines = frontmatter ? frontmatter[1].split(/\r?\n/) : [];
    const name = field(lines, "name");
    const description = field(lines, "description");
    if (!frontmatter || name !== skill || !description) {
      fail("Invalid/missing YAML frontmatter name or description: " + skill);
    }
  }

  for (const mirror of locations.slice(1)) {
    const target = path.join(root, mirror, skill, "SKILL.md");
    if (!fs.existsSync(target)) {
      fail("Missing mirror: " + path.relative(root, target));
      continue;
    }
    const mirrorBytes = readSkill(target);
    if (bytes && mirrorBytes && !bytes.equals(mirrorBytes)) {
      fail(
        "Skill drift: " +
          path.relative(root, target) +
          " differs from " +
          path.relative(root, canonicalPath),
      );
    }
  }
}

if (errors.length) {
  console.error(
    "RAD skill mirror guard FAILED:\n" +
      errors.map((error) => " - " + error).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    "RAD skill mirror guard PASSED: " + [...skillNames].sort().join(", "),
  );
}
