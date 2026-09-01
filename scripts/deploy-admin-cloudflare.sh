#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/admin"

API_URL="${API_URL:-https://rad-api-web-production-9b7c.up.railway.app}"
export API_URL

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  if ! npx wrangler whoami >/dev/null 2>&1; then
    echo "Cloudflare auth required."
    echo "Either export CLOUDFLARE_API_TOKEN or run: npx wrangler login"
    exit 1
  fi
fi

echo "Building admin for Cloudflare (API_URL=${API_URL})..."
npm run build:vinext

echo "Deploying rad-admin to Cloudflare Workers..."
npm run deploy:vinext

echo ""
echo "Admin deployed."
echo "Worker: https://rad-admin.rad-studio-admin.workers.dev"
