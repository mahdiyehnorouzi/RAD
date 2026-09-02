#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(tr -d '[:space:]' < VERSION)"
export RAD_VERSION="$VERSION"
export API_URL="${API_URL:-https://rad-api-web-production-9b7c.up.railway.app}"

echo "Deploying RAD ${VERSION}"

bash "$ROOT/scripts/deploy-api-railway.sh"
bash "$ROOT/scripts/deploy-storefront-cloudflare.sh"
bash "$ROOT/scripts/deploy-admin-cloudflare.sh"

echo "RAD ${VERSION} deployed."
