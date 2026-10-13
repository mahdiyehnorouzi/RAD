#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_PATH="${RAD_API_PATH:-/root/RAD}"
RAD_API_PM2_PROCESS="${RAD_API_PM2_PROCESS:-api}"
RAD_API_PORT="${RAD_API_PORT:-4000}"

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

if [[ ! -f "$ROOT/apps/api/ecosystem.config.js" ]]; then
  echo "apps/api/ecosystem.config.js not found locally. Refusing to deploy:"
  echo "the remote PM2 migration step below depends on it existing in the checked-out tree."
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
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- "$RAD_API_PATH" "$VERSION" "$RAD_API_PM2_PROCESS" "$RAD_API_PORT" <<'REMOTE_SCRIPT'
set -euo pipefail

REPO_PATH="$1"
EXPECTED_VERSION="$2"
PM2_PROCESS="$3"
APP_PORT="$4"

cd "$REPO_PATH"

if [[ ! -d .git ]]; then
  echo "ERROR: ${REPO_PATH} is not a git repository."
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: pm2 not found on PATH on this host."
  exit 1
fi

DIRTY="$(git status --porcelain)"
if [[ -n "$DIRTY" ]]; then
  echo "ERROR: remote working tree at ${REPO_PATH} is not clean. Refusing to deploy."
  echo "$DIRTY"
  exit 1
fi

# --- Snapshot the pre-deploy state, before anything is changed, so a human
# can roll back to it with scripts/rollback-api-server.sh if this run fails
# partway through. Never captures env var *values* (no secrets), only the
# commit, version, and PM2's own description of what it was running.
ROLLBACK_DIR="${REPO_PATH}/.deploy"
mkdir -p "$ROLLBACK_DIR"
PRE_DEPLOY_COMMIT="$(git rev-parse HEAD)"
PRE_DEPLOY_VERSION="$(tr -d '[:space:]' < VERSION 2>/dev/null || echo unknown)"
PRE_DEPLOY_PM2_DESCRIBE="$(pm2 jlist 2>/dev/null | node -e "
  try {
    const apps = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const app = apps.find((a) => a.name === process.argv[1]);
    console.log(JSON.stringify(app ?? null));
  } catch (e) { console.log('null'); }
" "$PM2_PROCESS" || echo 'null')"

ROLLBACK_MANIFEST="${ROLLBACK_DIR}/rollback-manifest.json"
node -e "
  const fs = require('fs');
  const manifest = {
    capturedAt: new Date().toISOString(),
    commit: process.argv[1],
    version: process.argv[2],
    pm2Describe: JSON.parse(process.argv[3]),
  };
  fs.writeFileSync(process.argv[4], JSON.stringify(manifest, null, 2));
" "$PRE_DEPLOY_COMMIT" "$PRE_DEPLOY_VERSION" "$PRE_DEPLOY_PM2_DESCRIBE" "$ROLLBACK_MANIFEST"
echo "Pre-deploy snapshot written to ${ROLLBACK_MANIFEST} (commit ${PRE_DEPLOY_COMMIT}, version ${PRE_DEPLOY_VERSION})."

PRE_DEPLOY_SCRIPT="$(echo "$PRE_DEPLOY_PM2_DESCRIBE" | node -e "
  try {
    const app = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    console.log(app ? \`\${app.pm2_env?.pm_exec_path ?? ''} \${(app.pm2_env?.args ?? []).join(' ')}\` : '(no existing process)');
  } catch (e) { console.log('(unknown)'); }
")"
echo "Currently running (pre-deploy): ${PRE_DEPLOY_SCRIPT}"
if echo "$PRE_DEPLOY_SCRIPT" | grep -qE 'npm.*dev:api|nest.*start.*--watch'; then
  echo "NOTICE: the currently running '${PM2_PROCESS}' process looks like it is in dev/watch mode."
  echo "This deploy will replace it with a production entry point managed via ecosystem.config.js."
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

if [[ ! -f apps/api/ecosystem.config.js ]]; then
  echo "ERROR: apps/api/ecosystem.config.js missing after pull. Refusing to touch the running PM2 process."
  exit 1
fi

echo "Installing dependencies..."
npm ci

echo "Typechecking API..."
npm run typecheck --workspace @rad/api

echo "Building API..."
npm run build --workspace @rad/api

# --- Migrate PM2 from whatever command it had cached to the ecosystem file.
# `pm2 restart` reuses the existing cached script/args/env and cannot change
# them, which is how production stayed on `npm run dev:api` through every
# past `pm2 restart --update-env`. `pm2 delete` + `pm2 start
# ecosystem.config.js` forces PM2 to adopt this file's script/args/env.
echo "Stopping existing '${PM2_PROCESS}' PM2 process (if any)..."
pm2 delete "$PM2_PROCESS" 2>/dev/null || echo "(no existing '${PM2_PROCESS}' process to delete)"

echo "Verifying port ${APP_PORT} is free before starting the new process..."
PORT_WAIT_SECONDS=10
elapsed=0
while (( elapsed < PORT_WAIT_SECONDS )); do
  if ! ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${APP_PORT}\$"; then
    break
  fi
  sleep 1
  elapsed=$(( elapsed + 1 ))
done
if ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${APP_PORT}\$"; then
  echo "ERROR: port ${APP_PORT} is still occupied ${PORT_WAIT_SECONDS}s after stopping '${PM2_PROCESS}'."
  echo "Refusing to start a second process on the same port. Investigate manually:"
  ss -ltnp 2>/dev/null | grep ":${APP_PORT}" || true
  echo "--- pm2 status ---"
  pm2 status || true
  echo "See ${ROLLBACK_MANIFEST} to restore the previous release with scripts/rollback-api-server.sh."
  exit 1
fi
echo "Port ${APP_PORT} is free."

echo "Starting '${PM2_PROCESS}' from ecosystem.config.js..."
cd apps/api
pm2 start ecosystem.config.js --only "$PM2_PROCESS" --update-env
cd "$REPO_PATH"
pm2 save

echo "Polling local API health on 127.0.0.1:${APP_PORT}..."
elapsed=0
timeout_seconds=180
interval_seconds=5
healthy=false
while (( elapsed < timeout_seconds )); do
  body_file="$(mktemp)"
  http_code="$(curl -fsS -o "$body_file" -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/health" 2>/dev/null || echo "000")"
  if [[ "$http_code" == "200" ]]; then
    resp_ok="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.ok===true))}catch(e){process.stdout.write('false')}" "$body_file")"
    resp_version="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.version||''))}catch(e){process.stdout.write('')}" "$body_file")"
    resp_env="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.env||''))}catch(e){process.stdout.write('')}" "$body_file")"
    rm -f "$body_file"
    if [[ "$resp_ok" == "true" && "$resp_version" == "$EXPECTED_VERSION" && "$resp_env" == "production" ]]; then
      echo "Local API healthy: ok=true version=${resp_version} env=${resp_env}"
      healthy=true
      break
    fi
    echo "Local API responded but not ready (ok=${resp_ok}, version=${resp_version}, env=${resp_env}, expected version=${EXPECTED_VERSION}, expected env=production)..."
  else
    rm -f "$body_file"
    echo "Local API not reachable yet (http_code=${http_code})..."
  fi
  sleep "$interval_seconds"
  elapsed=$(( elapsed + interval_seconds ))
done

if [[ "$healthy" != "true" ]]; then
  echo "ERROR: local API did not become healthy at version ${EXPECTED_VERSION} (env=production) within ${timeout_seconds}s."
  echo "--- pm2 status ---"
  pm2 status || true
  echo "--- pm2 logs (${PM2_PROCESS}, last 100 lines) ---"
  pm2 logs "$PM2_PROCESS" --lines 100 --nostream || true
  echo "Roll back with: scripts/rollback-api-server.sh (uses ${ROLLBACK_MANIFEST})"
  exit 1
fi

# --- Process-tree verification: exactly one process should own the port,
# and it must be the one PM2 just started (never a leftover orphan from the
# process this replaced).
NEW_PM2_PID="$(pm2 jlist | node -e "
  try {
    const apps = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const app = apps.find((a) => a.name === process.argv[1]);
    console.log(app ? app.pid : '');
  } catch (e) { console.log(''); }
" "$PM2_PROCESS")"
PORT_OWNERS="$(ss -ltnp 2>/dev/null | grep ":${APP_PORT} " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)"
PORT_OWNER_COUNT="$(echo "$PORT_OWNERS" | grep -c . || true)"
if [[ "$PORT_OWNER_COUNT" != "1" ]]; then
  echo "ERROR: expected exactly one process bound to port ${APP_PORT}, found: ${PORT_OWNERS:-none}"
  echo "A stray process may still be running from before this deploy. Investigate with:"
  echo "  ss -ltnp | grep ':${APP_PORT}'"
  echo "  ps -eo pid,ppid,etimes,cmd | grep -E 'dist/main\\.js|start-production'"
  exit 1
fi
if [[ -n "$NEW_PM2_PID" && "$PORT_OWNERS" != "$NEW_PM2_PID" ]]; then
  echo "ERROR: the process bound to port ${APP_PORT} (pid ${PORT_OWNERS}) is not PM2's '${PM2_PROCESS}' pid (${NEW_PM2_PID})."
  echo "This is exactly the orphaned-process failure mode this migration exists to prevent. Investigate before trusting this deploy."
  exit 1
fi
echo "Port ${APP_PORT} is owned solely by pid ${PORT_OWNERS}, matching PM2-managed '${PM2_PROCESS}' (pid ${NEW_PM2_PID})."

echo "Remote deploy of RAD API ${EXPECTED_VERSION} complete."
REMOTE_SCRIPT

echo "Remote API deploy step finished for ${SSH_TARGET}."
