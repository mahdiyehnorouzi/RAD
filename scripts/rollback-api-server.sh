#!/usr/bin/env bash
set -euo pipefail

# Restores the API to the commit that was running immediately before the
# last `deploy-api-server.sh` run, using the snapshot that script writes to
# .deploy/rollback-manifest.json on the remote host *before* it touches
# anything. Always starts the restored code via ecosystem.config.js in
# production mode — this never reverts to `npm run dev:api`, even if the
# pre-deploy state was already (incorrectly) running in dev mode, since the
# whole point is to never leave production in watch mode.
#
# Usage: scripts/rollback-api-server.sh [commit-sha]
#   With no argument, rolls back to the commit recorded in the manifest
#   from the most recent deploy attempt. Pass a commit explicitly to roll
#   back further.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_PATH="${RAD_API_PATH:-/root/RAD}"
RAD_API_PM2_PROCESS="${RAD_API_PM2_PROCESS:-api}"
RAD_API_PORT="${RAD_API_PORT:-4000}"
TARGET_COMMIT="${1:-}"

SSH_TARGET="${RAD_API_USER}@${RAD_API_HOST}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

echo "Rolling back RAD API on ${SSH_TARGET}:${RAD_API_PATH}..."
echo "This will stop the currently running '${RAD_API_PM2_PROCESS}' process and restart it at an older commit."
read -r -p "Type 'rollback' to continue: " CONFIRM
if [[ "$CONFIRM" != "rollback" ]]; then
  echo "Aborted."
  exit 1
fi

# shellcheck disable=SC2087
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- "$RAD_API_PATH" "$RAD_API_PM2_PROCESS" "$RAD_API_PORT" "$TARGET_COMMIT" <<'REMOTE_SCRIPT'
set -euo pipefail

REPO_PATH="$1"
PM2_PROCESS="$2"
APP_PORT="$3"
TARGET_COMMIT="$4"

cd "$REPO_PATH"

MANIFEST="${REPO_PATH}/.deploy/rollback-manifest.json"
if [[ -z "$TARGET_COMMIT" ]]; then
  if [[ ! -f "$MANIFEST" ]]; then
    echo "ERROR: no commit given and no ${MANIFEST} found. Pass a commit SHA explicitly."
    exit 1
  fi
  TARGET_COMMIT="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).commit)" "$MANIFEST")"
  echo "No commit given; using the one recorded before the last deploy: ${TARGET_COMMIT}"
  node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')), null, 2))" "$MANIFEST"
fi

DIRTY="$(git status --porcelain)"
if [[ -n "$DIRTY" ]]; then
  echo "ERROR: remote working tree at ${REPO_PATH} is not clean. Refusing to roll back."
  echo "$DIRTY"
  exit 1
fi

echo "Checking out ${TARGET_COMMIT}..."
git fetch origin
git checkout "$TARGET_COMMIT"

echo "Installing dependencies for the restored commit..."
npm ci

echo "Building API..."
npm run build --workspace @rad/api

echo "Stopping current '${PM2_PROCESS}' process..."
pm2 delete "$PM2_PROCESS" 2>/dev/null || echo "(no existing '${PM2_PROCESS}' process to delete)"

echo "Waiting for port ${APP_PORT} to free up..."
elapsed=0
while (( elapsed < 10 )); do
  if ! ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${APP_PORT}\$"; then
    break
  fi
  sleep 1
  elapsed=$(( elapsed + 1 ))
done
if ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${APP_PORT}\$"; then
  echo "ERROR: port ${APP_PORT} still occupied. Investigate manually before continuing:"
  ss -ltnp 2>/dev/null | grep ":${APP_PORT}" || true
  exit 1
fi

if [[ -f apps/api/ecosystem.config.js ]]; then
  echo "Starting restored commit via ecosystem.config.js (production mode)..."
  cd apps/api
  pm2 start ecosystem.config.js --only "$PM2_PROCESS" --update-env
  cd "$REPO_PATH"
else
  # Only reachable when rolling back to a commit from before this fix was
  # merged, i.e. one that predates ecosystem.config.js existing at all.
  echo "WARNING: ${TARGET_COMMIT} predates ecosystem.config.js."
  echo "Falling back to starting the production entry point directly, explicitly in production mode"
  echo "(never npm run dev:api, even though that script existed at this commit)."
  cd apps/api
  NODE_ENV=production pm2 start scripts/start-production.mjs --name "$PM2_PROCESS" --interpreter node --update-env
  cd "$REPO_PATH"
fi
pm2 save

ROLLED_BACK_VERSION="$(tr -d '[:space:]' < VERSION 2>/dev/null || echo unknown)"
echo "Polling local API health on 127.0.0.1:${APP_PORT}..."
elapsed=0
healthy=false
while (( elapsed < 180 )); do
  body_file="$(mktemp)"
  http_code="$(curl -fsS -o "$body_file" -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/health" 2>/dev/null || echo "000")"
  if [[ "$http_code" == "200" ]]; then
    resp_ok="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.ok===true))}catch(e){process.stdout.write('false')}" "$body_file")"
    resp_version="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.version||''))}catch(e){process.stdout.write('')}" "$body_file")"
    rm -f "$body_file"
    if [[ "$resp_ok" == "true" && "$resp_version" == "$ROLLED_BACK_VERSION" ]]; then
      echo "Rollback healthy: ok=true version=${resp_version}"
      healthy=true
      break
    fi
  else
    rm -f "$body_file"
  fi
  sleep 5
  elapsed=$(( elapsed + 5 ))
done

if [[ "$healthy" != "true" ]]; then
  echo "ERROR: rolled-back API did not become healthy. Manual intervention required."
  pm2 status || true
  pm2 logs "$PM2_PROCESS" --lines 100 --nostream || true
  exit 1
fi

echo "Rollback to ${TARGET_COMMIT} (version ${ROLLED_BACK_VERSION}) complete."
REMOTE_SCRIPT

echo "Remote rollback step finished for ${SSH_TARGET}."
