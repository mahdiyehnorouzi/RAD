#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${LIARA_API_TOKEN:-}" ]]; then
  echo "Liara auth required. Export LIARA_API_TOKEN (see docs/liara-migration.md)."
  exit 1
fi

if ! command -v liara >/dev/null 2>&1; then
  echo "Installing @liara/cli..."
  npm install -g @liara/cli
fi

echo "Deploying rad-storefront to Liara (Docker platform)..."
liara deploy \
  --path . \
  --liara-json apps/storefront/liara.json \
  --api-token "$LIARA_API_TOKEN" \
  --detach

echo ""
echo "Storefront deployment started. Check status/logs in the Liara console"
echo "or with: liara app:logs --app rad-storefront"
