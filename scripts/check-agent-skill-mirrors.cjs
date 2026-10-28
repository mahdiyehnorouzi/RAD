#!/usr/bin/env node
// Verify RAD-owned skills are mirrored byte-for-byte in all three agent directories.
// Pure read-only check; no dependencies, installs, generated files, or fixes.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const locations = ['.claude/skills', '.agents/skills', '.cursor/skills'];
const canonical = locations[0];
const errors = [];

function ownSkills(dir) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) {
    errors.push('Missing skill directory: ' + dir);
    return [];
  }
  return fs.readdirSync(absolute, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith('rad-'))
    .map(entry => entry.name);
}

const skillNames = new Set(locations.flatMap(ownSkills));
if (!skillNames.has('rad-safe-refactor')) {
  errors.push('Required skill rad-safe-refactor is missing.');
}

for (const skill of [...skillNames].sort()) {
  const canonicalPath = path.join(root, canonical, skill, 'SKILL.md');
  if (!fs.existsSync(canonicalPath)) {
    errors.push('Missing canonical skill: ' + path.relative(root, canonicalPath));
    continue;
  }
  const bytes = fs.readFileSync(canonicalPath);
  const body = bytes.toString('utf8');
  const nameMatch = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!nameMatch || !new RegExp('^name:\\s*' + skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm').test(nameMatch[1]) ||
      !/^description:\s*\S/m.test(nameMatch[1])) {
    errors.push('Invalid/missing YAML frontmatter name or description: ' + skill);
  }
  for (const mirror of locations.slice(1)) {
    const target = path.join(root, mirror, skill, 'SKILL.md');
    if (!fs.existsSync(target)) {
      errors.push('Missing mirror: ' + path.relative(root, target));
    } else if (!bytes.equals(fs.readFileSync(target))) {
      errors.push('Skill drift: ' + path.relative(root, target) + ' differs from ' + path.relative(root, canonicalPath));
    }
  }
}

if (errors.length) {
  console.error('RAD skill mirror guard FAILED:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exitCode = 1;
} else {
  console.log('RAD skill mirror guard PASSED: ' + [...skillNames].sort().join(', '));
}
