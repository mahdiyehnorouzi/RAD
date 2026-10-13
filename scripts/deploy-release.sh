#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(tr -d '[:space:]' < VERSION)"
export RAD_VERSION="$VERSION"
export API_URL="${API_URL:-https://api.rad-object.com}"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_PM2_PROCESS="${RAD_API_PM2_PROCESS:-api}"

HEALTH_URL="${API_URL}/health"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-180}"
HEALTH_POLL_INTERVAL_SECONDS="${HEALTH_POLL_INTERVAL_SECONDS:-5}"

verify_api_health() {
  echo "Verifying API health at ${HEALTH_URL} (expecting version ${VERSION})..."
  local elapsed=0
  local body_file
  body_file="$(mktemp)"
  while (( elapsed < HEALTH_TIMEOUT_SECONDS )); do
    local http_code
    http_code="$(curl -fsS -o "$body_file" -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || echo "000")"
    if [[ "$http_code" == "200" ]]; then
      local resp_ok resp_version resp_env
      resp_ok="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.ok===true))}catch(e){process.stdout.write('false')}" "$body_file")"
      resp_version="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.version||''))}catch(e){process.stdout.write('')}" "$body_file")"
      resp_env="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.env||''))}catch(e){process.stdout.write('')}" "$body_file")"
      # Version alone isn't enough: a leftover `nest start --watch` dev
      # process picks up new source on `git pull` and recompiles itself,
      # so it can report the right version while still running in dev mode.
      if [[ "$resp_ok" == "true" && "$resp_version" == "$VERSION" && "$resp_env" == "production" ]]; then
        echo "API healthy: ok=true version=${resp_version} env=${resp_env}"
        rm -f "$body_file"
        return 0
      fi
      echo "API responded but not ready yet (ok=${resp_ok}, version=${resp_version}, env=${resp_env}, expected version=${VERSION}, expected env=production)..."
    else
      echo "API not reachable yet (http_code=${http_code})..."
    fi
    sleep "$HEALTH_POLL_INTERVAL_SECONDS"
    elapsed=$(( elapsed + HEALTH_POLL_INTERVAL_SECONDS ))
  done

  rm -f "$body_file"
  echo "API did not become healthy at version ${VERSION} within ${HEALTH_TIMEOUT_SECONDS}s. Aborting release."
  echo "Fetching PM2 diagnostics from ${RAD_API_USER}@${RAD_API_HOST}..."
  ssh -o BatchMode=yes -o ConnectTimeout=10 "${RAD_API_USER}@${RAD_API_HOST}" \
    "pm2 status; echo '--- pm2 logs (${RAD_API_PM2_PROCESS}, last 100 lines) ---'; pm2 logs ${RAD_API_PM2_PROCESS} --lines 100 --nostream" \
    2>&1 || echo "(could not retrieve remote PM2 diagnostics)"
  return 1
}

echo "Deploying RAD ${VERSION}"

bash "$ROOT/scripts/deploy-api-server.sh"
verify_api_health
bash "$ROOT/scripts/deploy-storefront-cloudflare.sh"
bash "$ROOT/scripts/deploy-admin-cloudflare.sh"

echo "RAD ${VERSION} deployed."
