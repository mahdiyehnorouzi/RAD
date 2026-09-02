#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/admin"

API_URL="${API_URL:-https://rad-api-web-production-9b7c.up.railway.app}"
RAD_VERSION="${RAD_VERSION:-$(tr -d '[:space:]' < "$ROOT/VERSION")}"
export API_URL
export RAD_VERSION

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  if ! npx wrangler whoami >/dev/null 2>&1; then
    echo "Cloudflare auth required."
    echo "Either export CLOUDFLARE_API_TOKEN or run: npx wrangler login"
    exit 1
  fi
fi

echo "Building admin ${RAD_VERSION} for Cloudflare (API_URL=${API_URL})..."
npm run build:vinext

echo "Deploying rad-admin to Cloudflare Workers..."
npm run deploy:vinext

echo ""
echo "Admin deployed."
echo "Worker: https://rad-admin.rad-studio.workers.dev"
