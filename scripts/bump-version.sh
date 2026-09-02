#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-}"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Usage: scripts/bump-version.sh X.Y.Z"
  exit 1
fi

cd "$ROOT"
printf '%s\n' "$VERSION" > VERSION

node --input-type=module -e "
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const version = process.argv[1];
const root = process.argv[2];
const files = [
  'package.json',
  'apps/storefront/package.json',
  'apps/admin/package.json',
  'apps/api/package.json',
  'packages/i18n/package.json',
  'packages/state/package.json',
  'packages/types/package.json',
  'packages/ui/package.json',
];

for (const relative of files) {
  const path = join(root, relative);
  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  pkg.version = version;
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[key];
    if (!deps) continue;
    for (const name of Object.keys(deps)) {
      if (name.startsWith('@rad/')) deps[name] = version;
    }
  }
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
}

const versionFile = join(root, 'apps/api/src/version.ts');
writeFileSync(versionFile, \`export const APP_VERSION = \"\${version}\";\n\`);

for (const relative of ['apps/storefront/wrangler.jsonc', 'apps/admin/wrangler.jsonc']) {
  const path = join(root, relative);
  const next = readFileSync(path, 'utf8').replace(
    /(\"RAD_VERSION\"\\s*:\\s*\")[^\"]*(\")/,
    \`\$1\${version}\$2\`,
  );
  if (!next.includes('\"RAD_VERSION\"')) {
    throw new Error(\`Missing RAD_VERSION in \${relative}\`);
  }
  writeFileSync(path, next);
}
" "$VERSION" "$ROOT"

npm install --package-lock-only --ignore-scripts

echo "Set product version to ${VERSION}"
echo "Next: add a CHANGELOG section, commit, then tag v${VERSION} to deploy."
