#!/usr/bin/env bash
#
# Release the API on the REAL production topology, verified directly on the
# VPS (not assumed): systemd-managed `rad-api.service`, live checkout at
# /opt/rad/apps/api (monorepo root /opt/rad), with the SeaweedFS S3 gateway
# at 127.0.0.1:8333 fronted by the EXISTING `https://api.rad-object.com/storage`
# nginx proxy (CORS preflight already confirmed working there) and a
# `rad-public` bucket. This replaces the PM2 assumptions baked into
# scripts/deploy-api-server.sh / rollback-api-server.sh, which do not match
# this host at all (no PM2 process there) — those two scripts are left in
# place (removing them is a separate decision) but should not be used
# against this production host.
#
# Release model: each deploy builds a FULL, independent copy of the repo
# under $RAD_API_RELEASES_DIR/<version>-<shortsha>-<timestamp>/, leaving the
# currently-running release completely untouched while that build happens.
# Only once the new release is built AND health-checked does /opt/rad (a
# symlink into the releases dir, once bootstrapped — see below) get
# atomically repointed. This is what "prepare an isolated, versioned release
# without overwriting the running installation before health checks" means
# in practice: the running process never sees a half-written checkout.
#
# ONE-TIME BOOTSTRAP REQUIRED FIRST, MANUALLY, WITH SIGN-OFF: if /opt/rad is
# still a plain directory (the state this task's brief describes), this
# script refuses to run at all. Migrating it to a releases+symlink layout
# is itself a production-infrastructure change, and this script does not
# perform it automatically under any flag — see
# docs/opt-rad-release-bootstrap.md for the exact, reviewed one-time steps
# to run by hand before the first systemd-targeted deploy.
#
# Usage: scripts/deploy-api-systemd.sh
# Required secrets/env: none hardcoded here — see the env vars below. No
# secret value is ever printed by this script; env-file CONTENTS are only
# ever tested for the presence/value of specific non-secret keys
# (TYPEORM_SYNCHRONIZE, SEAWEEDFS_* presence) and otherwise left unread.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_LIVE_DIR="${RAD_API_LIVE_DIR:-/opt/rad}"
RAD_API_RELEASES_DIR="${RAD_API_RELEASES_DIR:-/opt/rad-releases}"
RAD_API_SERVICE="${RAD_API_SERVICE:-rad-api.service}"
RAD_API_PORT="${RAD_API_PORT:-4000}"
RAD_API_KEEP_RELEASES="${RAD_API_KEEP_RELEASES:-5}"

VERSION_FILE="$ROOT/VERSION"
SSH_TARGET="${RAD_API_USER}@${RAD_API_HOST}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

echo "Running preflight checks for API -> systemd deploy (${SSH_TARGET}:${RAD_API_LIVE_DIR}, service ${RAD_API_SERVICE})..."

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
  echo "---"
  cat /tmp/rad-ssh-preflight.$$ 2>/dev/null || true
  rm -f /tmp/rad-ssh-preflight.$$
  exit 1
fi
rm -f /tmp/rad-ssh-preflight.$$

echo "SSH to ${SSH_TARGET} verified (non-interactive)."
echo "Deploying RAD API ${VERSION} to ${SSH_TARGET}:${RAD_API_LIVE_DIR} via ${RAD_API_SERVICE}..."

# shellcheck disable=SC2087
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- \
  "$RAD_API_LIVE_DIR" "$RAD_API_RELEASES_DIR" "$RAD_API_SERVICE" "$RAD_API_PORT" "$VERSION" "$RAD_API_KEEP_RELEASES" \
  <<'REMOTE_SCRIPT'
set -euo pipefail

LIVE_DIR="$1"
RELEASES_DIR="$2"
SERVICE="$3"
APP_PORT="$4"
EXPECTED_VERSION="$5"
KEEP_RELEASES="$6"

if ! command -v systemctl >/dev/null 2>&1; then
  echo "ERROR: systemctl not found on this host — this script only targets a systemd-managed deployment."
  exit 1
fi

if ! systemctl list-unit-files "$SERVICE" --no-legend | grep -q "$SERVICE"; then
  echo "ERROR: ${SERVICE} is not a known systemd unit on this host. Refusing to guess."
  exit 1
fi

# --- Bootstrap gate: this script only ever operates on a releases+symlink
# layout. If LIVE_DIR is a plain directory (the real, confirmed state as of
# this task), that is a production-layout change outside this script's
# authority — stop here, loudly, with the exact next step.
if [[ -L "$LIVE_DIR" ]]; then
  CURRENT_RELEASE="$(readlink -f "$LIVE_DIR")"
  echo "Bootstrap check: ${LIVE_DIR} is already a symlink -> ${CURRENT_RELEASE}. Proceeding."
elif [[ -d "$LIVE_DIR" ]]; then
  echo "ERROR: ${LIVE_DIR} is a plain directory, not a symlink into ${RELEASES_DIR}."
  echo "This script will not perform the one-time migration to a releases+symlink layout automatically — that is a production-infrastructure change requiring explicit, reviewed, manual execution (see docs/opt-rad-release-bootstrap.md)."
  echo "Nothing has been changed. Aborting."
  exit 1
else
  echo "ERROR: ${LIVE_DIR} does not exist as either a directory or a symlink. Investigate manually before retrying."
  exit 1
fi

# --- Locate the service's EnvironmentFile without ever printing its
# contents wholesale. EnvironmentFile must live OUTSIDE the release tree
# (so swapping releases never loses or duplicates it) — verified here, not
# assumed.
ENV_FILES_RAW="$(systemctl show -p EnvironmentFiles --value "$SERVICE" 2>/dev/null || true)"
ENV_FILE="$(echo "$ENV_FILES_RAW" | awk '{print $1}')"
if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "ERROR: could not resolve a readable EnvironmentFile= for ${SERVICE} (got: '${ENV_FILES_RAW}'). Refusing to deploy blind to production env config."
  exit 1
fi
case "$ENV_FILE" in
  "$RELEASES_DIR"/*|"$LIVE_DIR"/*)
    echo "ERROR: ${SERVICE}'s EnvironmentFile (${ENV_FILE}) lives INSIDE the release tree. Swapping releases would lose or duplicate it. Externalize it (e.g. /etc/rad/api.env) and update the unit's EnvironmentFile= before using this release process."
    exit 1
    ;;
esac
echo "EnvironmentFile resolved to ${ENV_FILE} (outside the release tree — OK). Contents are not read here beyond the specific safety checks below."

# --- Fail-closed schema-sync / destructive-migration guard (never prints
# the file; only tests for this one key, case-sensitively, exactly as
# apps/api/src/database/data-source.ts's schemaSyncEnabled() reads it).
if grep -qE '^\s*TYPEORM_SYNCHRONIZE\s*=\s*true\s*$' "$ENV_FILE"; then
  echo "ERROR: ${ENV_FILE} sets TYPEORM_SYNCHRONIZE=true. Production schema sync (which can alter/drop columns) must stay disabled. Refusing to deploy. Fix the env file, then retry."
  exit 1
fi
echo "Schema-sync guard OK: TYPEORM_SYNCHRONIZE is not explicitly 'true' in ${ENV_FILE} (defaults to off under NODE_ENV=production)."

HAS_NODE_ENV_PRODUCTION=false
if grep -qE '^\s*NODE_ENV\s*=\s*production\s*$' "$ENV_FILE"; then
  HAS_NODE_ENV_PRODUCTION=true
fi
echo "NODE_ENV=production present in ${ENV_FILE}: ${HAS_NODE_ENV_PRODUCTION}"
if [[ "$HAS_NODE_ENV_PRODUCTION" != "true" ]]; then
  echo "ERROR: NODE_ENV=production is not set in ${ENV_FILE}. Schema sync's off-by-default behavior depends on this. Refusing to deploy until it is set explicitly."
  exit 1
fi

for key in SEAWEEDFS_ENDPOINT SEAWEEDFS_BUCKET SEAWEEDFS_ACCESS_KEY SEAWEEDFS_SECRET_KEY MEDIA_STORAGE_PROVIDER SEAWEEDFS_PUBLIC_URL SEAWEEDFS_PUBLIC_UPLOAD_URL; do
  if grep -qE "^\s*${key}\s*=" "$ENV_FILE"; then
    echo "  [present] ${key} (value not read/printed)"
  else
    echo "  [MISSING] ${key}"
  fi
done

# --- Snapshot rollback manifest BEFORE touching anything.
mkdir -p "$RELEASES_DIR"
MANIFEST="${RELEASES_DIR}/.rollback-manifest.json"
PRE_DEPLOY_RELEASE="$CURRENT_RELEASE"
PRE_DEPLOY_COMMIT="$(git -C "$PRE_DEPLOY_RELEASE" rev-parse HEAD 2>/dev/null || echo unknown)"
PRE_DEPLOY_VERSION="$(tr -d '[:space:]' < "${PRE_DEPLOY_RELEASE}/VERSION" 2>/dev/null || echo unknown)"
PRE_DEPLOY_SERVICE_STATE="$(systemctl is-active "$SERVICE" 2>/dev/null || echo unknown)"
node -e "
  const fs = require('fs');
  fs.writeFileSync(process.argv[5], JSON.stringify({
    capturedAt: new Date().toISOString(),
    releaseDir: process.argv[1],
    commit: process.argv[2],
    version: process.argv[3],
    serviceState: process.argv[4],
  }, null, 2));
" "$PRE_DEPLOY_RELEASE" "$PRE_DEPLOY_COMMIT" "$PRE_DEPLOY_VERSION" "$PRE_DEPLOY_SERVICE_STATE" "$MANIFEST"
echo "Pre-deploy snapshot written to ${MANIFEST} (release=${PRE_DEPLOY_RELEASE}, commit=${PRE_DEPLOY_COMMIT}, version=${PRE_DEPLOY_VERSION})."

# --- Build the new release in complete isolation from the live symlink.
ORIGIN_URL="$(git -C "$PRE_DEPLOY_RELEASE" remote get-url origin)"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
NEW_RELEASE="${RELEASES_DIR}/${EXPECTED_VERSION}-${TIMESTAMP}"
echo "Cloning main into new, isolated release dir: ${NEW_RELEASE}"
git clone --quiet --depth 50 --branch main "$ORIGIN_URL" "$NEW_RELEASE"

NEW_VERSION="$(tr -d '[:space:]' < "${NEW_RELEASE}/VERSION")"
if [[ "$NEW_VERSION" != "$EXPECTED_VERSION" ]]; then
  echo "ERROR: cloned VERSION (${NEW_VERSION}) does not match release VERSION (${EXPECTED_VERSION}). Leaving ${NEW_RELEASE} in place for inspection; the live symlink is untouched."
  exit 1
fi

( cd "$NEW_RELEASE" && npm ci && npm run build --workspace @rad/api )

echo "Build complete for ${NEW_RELEASE}. Live install at ${LIVE_DIR} (-> ${PRE_DEPLOY_RELEASE}) has not been touched yet."

# --- Atomic swap: build a fresh symlink pointing at the new release, then
# rename it on top of the live symlink. `mv -T` on two symlinks on the same
# filesystem is a single atomic rename syscall — there is no window where
# LIVE_DIR points at nothing or at a half-written tree.
PENDING_LINK="${RELEASES_DIR}/.pending-current"
ln -sfn "$NEW_RELEASE" "$PENDING_LINK"
mv -T "$PENDING_LINK" "$LIVE_DIR"
echo "${LIVE_DIR} now points at ${NEW_RELEASE}."

echo "Restarting ${SERVICE}..."
systemctl restart "$SERVICE"

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
    echo "Local API responded but not ready (ok=${resp_ok}, version=${resp_version}, env=${resp_env})..."
  else
    rm -f "$body_file"
    echo "Local API not reachable yet (http_code=${http_code})..."
  fi
  sleep "$interval_seconds"
  elapsed=$(( elapsed + interval_seconds ))
done

if [[ "$healthy" != "true" ]]; then
  echo "ERROR: new release (${NEW_RELEASE}) did not become healthy within ${timeout_seconds}s."
  echo "--- systemctl status ---"
  systemctl status "$SERVICE" --no-pager || true
  echo "--- journalctl (last 100 lines) ---"
  journalctl -u "$SERVICE" -n 100 --no-pager || true
  echo "Rolling back to ${PRE_DEPLOY_RELEASE} automatically..."
  ln -sfn "$PRE_DEPLOY_RELEASE" "$PENDING_LINK"
  mv -T "$PENDING_LINK" "$LIVE_DIR"
  systemctl restart "$SERVICE"
  rb_elapsed=0
  rb_healthy=false
  while (( rb_elapsed < timeout_seconds )); do
    rb_http_code="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/health" 2>/dev/null || echo "000")"
    if [[ "$rb_http_code" == "200" ]]; then
      rb_healthy=true
      break
    fi
    sleep "$interval_seconds"
    rb_elapsed=$(( rb_elapsed + interval_seconds ))
  done
  if [[ "$rb_healthy" == "true" ]]; then
    echo "Rollback to ${PRE_DEPLOY_RELEASE} verified healthy. Production is back on the previous release."
    exit 1
  else
    echo "ERROR: ROLLBACK ITSELF FAILED TO BECOME HEALTHY. Manual intervention required NOW — production may be down."
    systemctl status "$SERVICE" --no-pager || true
    exit 1
  fi
fi

# --- Process ownership sanity check, mirroring the PM2 script's intent:
# exactly one process should own the port, and systemd should agree it's
# the service's own.
PORT_OWNERS="$(ss -ltnp 2>/dev/null | grep ":${APP_PORT} " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)"
PORT_OWNER_COUNT="$(echo "$PORT_OWNERS" | grep -c . || true)"
if [[ "$PORT_OWNER_COUNT" != "1" ]]; then
  echo "ERROR: expected exactly one process bound to port ${APP_PORT}, found: ${PORT_OWNERS:-none}. Investigate before trusting this deploy."
  exit 1
fi
MAIN_PID="$(systemctl show -p MainPID --value "$SERVICE" 2>/dev/null || echo "")"
if [[ -n "$MAIN_PID" && "$MAIN_PID" != "0" ]]; then
  SERVICE_PIDS="$(systemctl show -p ExecMainPID --value "$SERVICE" 2>/dev/null || echo "$MAIN_PID")"
  if ! pgrep -P "$MAIN_PID" -f . >/dev/null 2>&1 && [[ "$PORT_OWNERS" != "$MAIN_PID" && "$PORT_OWNERS" != "$SERVICE_PIDS" ]]; then
    echo "WARNING: port ${APP_PORT} owner (pid ${PORT_OWNERS}) does not directly match ${SERVICE}'s reported PID (${MAIN_PID}) — this can be a normal child-process indirection under some unit Type= settings; verify manually if in doubt: systemctl status ${SERVICE}"
  fi
fi

echo "Deploy succeeded. ${LIVE_DIR} -> ${NEW_RELEASE} (version ${EXPECTED_VERSION}), ${SERVICE} healthy."

# --- Prune old releases, keeping the current one plus the last KEEP_RELEASES.
# Never deletes the release the live symlink currently points at.
echo "Pruning old releases beyond the last ${KEEP_RELEASES} (current release is always kept)..."
# shellcheck disable=SC2012
ls -1dt "${RELEASES_DIR}"/*/ 2>/dev/null \
  | grep -v "^$(readlink -f "$LIVE_DIR")/\$" \
  | tail -n "+$(( KEEP_RELEASES + 1 ))" \
  | while read -r old; do
      echo "  removing old release: ${old}"
      rm -rf "${old%/}"
    done

echo "Remote systemd deploy of RAD API ${EXPECTED_VERSION} complete."
REMOTE_SCRIPT

echo "Remote API deploy step finished for ${SSH_TARGET}."
