#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_PATH="${RAD_API_PATH:-/root/RAD}"
RAD_API_PM2_PROCESS="${RAD_API_PM2_PROCESS:-api}"

VERSION_FILE="$ROOT/VERSION"
SSH_TARGET="${RAD_API_USER}@${RAD_API_HOST}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

echo "Running preflight checks for API -> server deploy (${SSH_TARGET}:${RAD_API_PATH})..."

if ! command -v ssh >/dev/null 2>&1; then
  echo "ssh not found on this machine."
  exit 1
fi

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "VERSION file not found at $VERSION_FILE"
  exit 1
fi

VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"

if ! ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'true' 2>/tmp/rad-ssh-preflight.$$; then
  echo "Non-interactive SSH authentication to ${SSH_TARGET} failed."
  echo "Non-interactive releases require SSH key authentication (key in your agent or ~/.ssh/config),"
  echo "not a password prompt. Set up a key with: ssh-copy-id ${SSH_TARGET}"
  echo "(or add an SSH config entry / load the key into ssh-agent), then re-run."
  echo "---"
  cat /tmp/rad-ssh-preflight.$$ 2>/dev/null || true
  rm -f /tmp/rad-ssh-preflight.$$
  exit 1
fi
rm -f /tmp/rad-ssh-preflight.$$

echo "SSH to ${SSH_TARGET} verified (non-interactive)."
echo "Deploying RAD API ${VERSION} on ${SSH_TARGET}:${RAD_API_PATH}..."

# shellcheck disable=SC2087
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- "$RAD_API_PATH" "$VERSION" "$RAD_API_PM2_PROCESS" <<'REMOTE_SCRIPT'
set -euo pipefail

REPO_PATH="$1"
EXPECTED_VERSION="$2"
PM2_PROCESS="$3"

cd "$REPO_PATH"

if [[ ! -d .git ]]; then
  echo "ERROR: ${REPO_PATH} is not a git repository."
  exit 1
fi

DIRTY="$(git status --porcelain)"
if [[ -n "$DIRTY" ]]; then
  echo "ERROR: remote working tree at ${REPO_PATH} is not clean. Refusing to deploy."
  echo "$DIRTY"
  exit 1
fi

echo "Fetching main..."
git fetch origin main
git checkout main
git pull --ff-only origin main

REMOTE_VERSION="$(tr -d '[:space:]' < VERSION)"
if [[ "$REMOTE_VERSION" != "$EXPECTED_VERSION" ]]; then
  echo "ERROR: checked-out VERSION (${REMOTE_VERSION}) does not match release VERSION (${EXPECTED_VERSION})."
  exit 1
fi

echo "Installing dependencies..."
npm ci

echo "Typechecking API..."
npm run typecheck --workspace @rad/api

echo "Building API..."
npm run build --workspace @rad/api

echo "Restarting PM2 process '${PM2_PROCESS}'..."
pm2 restart "$PM2_PROCESS" --update-env
pm2 save

echo "Polling local API health on 127.0.0.1:4000..."
elapsed=0
timeout_seconds=180
interval_seconds=5
healthy=false
while (( elapsed < timeout_seconds )); do
  body_file="$(mktemp)"
  http_code="$(curl -fsS -o "$body_file" -w '%{http_code}' http://127.0.0.1:4000/health 2>/dev/null || echo "000")"
  if [[ "$http_code" == "200" ]]; then
    resp_ok="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.ok===true))}catch(e){process.stdout.write('false')}" "$body_file")"
    resp_version="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.version||''))}catch(e){process.stdout.write('')}" "$body_file")"
    rm -f "$body_file"
    if [[ "$resp_ok" == "true" && "$resp_version" == "$EXPECTED_VERSION" ]]; then
      echo "Local API healthy: ok=true version=${resp_version}"
      healthy=true
      break
    fi
    echo "Local API responded but not ready (ok=${resp_ok}, version=${resp_version}, expected=${EXPECTED_VERSION})..."
  else
    rm -f "$body_file"
    echo "Local API not reachable yet (http_code=${http_code})..."
  fi
  sleep "$interval_seconds"
  elapsed=$(( elapsed + interval_seconds ))
done

if [[ "$healthy" != "true" ]]; then
  echo "ERROR: local API did not become healthy at version ${EXPECTED_VERSION} within ${timeout_seconds}s."
  echo "--- pm2 status ---"
  pm2 status || true
  echo "--- pm2 logs (${PM2_PROCESS}, last 100 lines) ---"
  pm2 logs "$PM2_PROCESS" --lines 100 --nostream || true
  exit 1
fi

echo "Remote deploy of RAD API ${EXPECTED_VERSION} complete."
REMOTE_SCRIPT

echo "Remote API deploy step finished for ${SSH_TARGET}."
