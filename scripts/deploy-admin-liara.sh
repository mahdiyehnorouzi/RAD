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

# IMAGE_REF: a prebuilt image already pushed to a public registry (set by
# .github/workflows/deploy-admin-liara.yml after building on GitHub Actions).
# Falls back to the GHCR `latest` tag for manual/local runs.
IMAGE_REF="${IMAGE_REF:-ghcr.io/${GITHUB_REPOSITORY_OWNER:-mahdiyehnorouzi}/rad-admin:latest}"

echo "Deploying rad-admin to Liara from prebuilt image: ${IMAGE_REF}"
liara deploy \
  --liara-json apps/admin/liara.json \
  --api-token "$LIARA_API_TOKEN" \
  --image "$IMAGE_REF" \
  --detach

echo ""
echo "Admin deployment started. Check status/logs in the Liara console"
echo "or with: liara app:logs --app rad-admin"
