#!/usr/bin/env bash
#
# Remote body of scripts/deploy-api-systemd-artifact.sh — runs ON the
# target host. Requires scripts/bootstrap-api-release-layout.sh to have
# already been run (LIVE_DIR must already be a symlink).
#
# This is the ROUTINE release path: unlike deploy-api-remote.sh (which
# clones the whole monorepo and runs `npm ci && npm run build` ON the
# VPS, on every single deploy), this script only ever EXTRACTS an
# already-built, already-verified artifact that GitHub Actions produced
# and transferred here (see scripts/deploy-api-systemd-artifact.sh) — no
# git, no npm install, no TypeScript build, no network access to npm's
# registry, ever happens on the VPS itself. The artifact already contains
# `apps/api/dist`, `apps/api/package.json`, `apps/api/scripts`, a
# production-only `node_modules`, and `VERSION`, laid out exactly as the
# monorepo checkout's own relative structure (node_modules as a sibling
# of `apps/`), so Node's normal upward module-resolution walk finds the
# same node_modules it would in a full checkout — nothing about how the
# app resolves its own dependencies changes.
#
# Everything else — the atomic symlink swap, the pre-deploy env/manifest
# snapshot, the post-swap health poll, and the automatic rollback on a
# failed restart or failed health check — is IDENTICAL to
# deploy-api-remote.sh (the git-clone-and-build path, kept as the
# emergency/disaster-recovery fallback for when a pre-built artifact
# genuinely isn't an option). Keep the two in sync if either changes.
set -euo pipefail

LIVE_DIR="$1"              # /opt/rad/apps/api
RELEASES_DIR="$2"          # /opt/rad-releases
SERVICE="$3"               # rad-api.service
APP_PORT="$4"              # 4000
ENV_FILE_TARGET="$5"       # /etc/rad/api.env - must already be externalized by bootstrap
ARTIFACT_PATH="$6"         # path on THIS host to the already-transferred tarball
COMMIT_SHA="$7"            # the exact commit this artifact was built from (for labeling only)
KEEP_RELEASES="${8:-5}"

poll_health() {
  local port="$1" expected_version="${2:-}" timeout_seconds="${3:-180}" interval=5
  local elapsed=0 healthy=false
  while (( elapsed < timeout_seconds )); do
    local body_file http_code
    body_file="$(mktemp)"
    http_code="$(curl -fsS -o "$body_file" -w '%{http_code}' "http://127.0.0.1:${port}/health" 2>/dev/null || echo "000")"
    if [[ "$http_code" == "200" ]]; then
      local resp_ok resp_version resp_env
      resp_ok="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.ok===true))}catch(e){process.stdout.write('false')}" "$body_file")"
      resp_version="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.version||''))}catch(e){process.stdout.write('')}" "$body_file")"
      resp_env="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write('env' in d ? String(d.env) : '')}catch(e){process.stdout.write('')}" "$body_file")"
      rm -f "$body_file"
      local version_ok=true
      [[ -n "$expected_version" && "$resp_version" != "$expected_version" ]] && version_ok=false
      local env_ok=true
      [[ -n "$resp_env" && "$resp_env" != "production" ]] && env_ok=false
      if [[ "$resp_ok" == "true" && "$version_ok" == "true" && "$env_ok" == "true" ]]; then
        echo "Healthy: ok=true version=${resp_version} env=${resp_env:-<absent>}"
        healthy=true
        break
      fi
      echo "Responded but not ready (ok=${resp_ok} version=${resp_version} env=${resp_env:-<absent>}, expected version=${expected_version:-<any>})..."
    else
      rm -f "$body_file"
      echo "Not reachable yet (http_code=${http_code})..."
    fi
    sleep "$interval"
    elapsed=$(( elapsed + interval ))
  done
  [[ "$healthy" == "true" ]]
}

if [[ -z "$COMMIT_SHA" ]]; then
  echo "ERROR: no commit SHA given (labeling only, but required so releases are traceable)."
  exit 1
fi
if [[ -z "$ARTIFACT_PATH" || ! -f "$ARTIFACT_PATH" ]]; then
  echo "ERROR: artifact tarball not found at ${ARTIFACT_PATH:-<empty>}. It must already have been transferred to this host before this script runs."
  exit 1
fi

if ! command -v systemctl >/dev/null 2>&1 || ! systemctl list-unit-files "$SERVICE" --no-legend 2>/dev/null | grep -q "$SERVICE"; then
  echo "ERROR: ${SERVICE} is not a known systemd unit on this host."
  exit 1
fi

if [[ ! -L "$LIVE_DIR" ]]; then
  echo "ERROR: ${LIVE_DIR} is not a symlink. Run scripts/bootstrap-api-release-layout.sh first - this script will not migrate a plain directory itself."
  exit 1
fi
PRE_DEPLOY_RELEASE="$(readlink -f "$LIVE_DIR")"

ACTUAL_ENV_FILE="$(systemctl show -p EnvironmentFiles --value "$SERVICE" 2>/dev/null | awk '{print $1}')"
if [[ "$ACTUAL_ENV_FILE" != "$ENV_FILE_TARGET" ]]; then
  echo "ERROR: ${SERVICE}'s actual EnvironmentFile (${ACTUAL_ENV_FILE:-<unset>}) does not match the expected externalized path (${ENV_FILE_TARGET}). Refusing to deploy against an env file this script doesn't know is safe to snapshot/restore."
  exit 1
fi
if [[ ! -f "$ENV_FILE_TARGET" ]]; then
  echo "ERROR: ${ENV_FILE_TARGET} does not exist. Refusing to deploy blind to production env config."
  exit 1
fi

if grep -qE '^\s*TYPEORM_SYNCHRONIZE\s*=\s*true\s*$' "$ENV_FILE_TARGET"; then
  echo "ERROR: ${ENV_FILE_TARGET} sets TYPEORM_SYNCHRONIZE=true. Refusing to deploy. Fix the env file, then retry."
  exit 1
fi
if ! grep -qE '^\s*NODE_ENV\s*=\s*production\s*$' "$ENV_FILE_TARGET"; then
  echo "ERROR: NODE_ENV=production is not set in ${ENV_FILE_TARGET}. Refusing to deploy until it is set explicitly."
  exit 1
fi
echo "Schema-sync / NODE_ENV guard OK."

mkdir -p "$RELEASES_DIR" "${RELEASES_DIR}/.env-snapshots"
MANIFEST="${RELEASES_DIR}/.rollback-manifest.json"
PRE_DEPLOY_COMMIT="$(git -C "$PRE_DEPLOY_RELEASE" rev-parse HEAD 2>/dev/null || echo "unknown")"
PRE_DEPLOY_VERSION="$(curl -fsS "http://127.0.0.1:${APP_PORT}/health" 2>/dev/null | node -e "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.version||'unknown'))}catch(e){process.stdout.write('unknown')}" || echo unknown)"
PRE_DEPLOY_SERVICE_STATE="$(systemctl is-active "$SERVICE" 2>/dev/null || echo unknown)"

# --- Snapshot the env file EXACTLY as it is right now, before this deploy
# touches anything — same rationale as deploy-api-remote.sh: a rollback
# restores THIS snapshot, never whatever the env file contains at rollback
# time.
ENV_SNAPSHOT="${RELEASES_DIR}/.env-snapshots/pre-deploy-$(date -u +%Y%m%dT%H%M%SZ).env"
install -m 600 "$ENV_FILE_TARGET" "$ENV_SNAPSHOT"

node -e "
  const fs = require('fs');
  fs.writeFileSync(process.argv[6], JSON.stringify({
    capturedAt: new Date().toISOString(),
    releaseDir: process.argv[1],
    commit: process.argv[2],
    version: process.argv[3],
    serviceState: process.argv[4],
    envSnapshot: process.argv[5],
  }, null, 2));
" "$PRE_DEPLOY_RELEASE" "$PRE_DEPLOY_COMMIT" "$PRE_DEPLOY_VERSION" "$PRE_DEPLOY_SERVICE_STATE" "$ENV_SNAPSHOT" "$MANIFEST"
echo "Pre-deploy snapshot written to ${MANIFEST} (release=${PRE_DEPLOY_RELEASE}, commit=${PRE_DEPLOY_COMMIT}, version=${PRE_DEPLOY_VERSION}, envSnapshot=${ENV_SNAPSHOT})."

# --- Extract the pre-built artifact into a brand-new, isolated release
# directory. No git clone, no npm install, no build — all of that already
# happened on the GitHub Actions runner that produced this exact tarball
# from the exact COMMIT_SHA being released.
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SHORT_SHA="${COMMIT_SHA:0:12}"
NEW_RELEASE_DIR="${RELEASES_DIR}/release-${SHORT_SHA}-${TIMESTAMP}"
echo "Extracting artifact ${ARTIFACT_PATH} into ${NEW_RELEASE_DIR}..."
mkdir -p "$NEW_RELEASE_DIR"
tar -xzf "$ARTIFACT_PATH" -C "$NEW_RELEASE_DIR"

NEW_RELEASE_API_DIR="${NEW_RELEASE_DIR}/apps/api"
for required in dist/main.js scripts/start-production.mjs package.json; do
  if [[ ! -e "${NEW_RELEASE_API_DIR}/${required}" ]]; then
    echo "ERROR: ${NEW_RELEASE_API_DIR}/${required} missing from the extracted artifact. Aborting; live symlink untouched."
    exit 1
  fi
done
if [[ ! -d "${NEW_RELEASE_DIR}/node_modules/@nestjs" ]]; then
  echo "ERROR: ${NEW_RELEASE_DIR}/node_modules does not look like a real production install (no @nestjs packages found). Aborting; live symlink untouched."
  exit 1
fi
echo "Verified: ${NEW_RELEASE_API_DIR} has a built dist/, start-production.mjs, and a populated node_modules. Live install at ${LIVE_DIR} (-> ${PRE_DEPLOY_RELEASE}) has not been touched yet."

# Done with the staged tarball — don't let repeated deploys accumulate disk usage.
rm -f "$ARTIFACT_PATH"

restore_previous_release_and_env() {
  echo "Rolling back: restoring symlink to ${PRE_DEPLOY_RELEASE} AND the pre-deploy env snapshot (${ENV_SNAPSHOT}) before restarting - never leaves old code running against whatever this deploy's env may have introduced."
  local pending="${RELEASES_DIR}/.pending-current"
  ln -sfn "$PRE_DEPLOY_RELEASE" "$pending"
  mv -T "$pending" "$LIVE_DIR"
  install -m 600 "$ENV_SNAPSHOT" "$ENV_FILE_TARGET"
  if ! systemctl restart "$SERVICE"; then
    echo "ERROR: ROLLBACK's OWN systemctl restart FAILED. Manual intervention required NOW - production may be down."
    systemctl status "$SERVICE" --no-pager || true
    return 1
  fi
  if poll_health "$APP_PORT" "$PRE_DEPLOY_VERSION" "${RAD_HEALTH_TIMEOUT_SECONDS:-180}"; then
    echo "Rollback verified healthy: ${LIVE_DIR} -> ${PRE_DEPLOY_RELEASE} (version ${PRE_DEPLOY_VERSION}), env restored from ${ENV_SNAPSHOT}."
    return 0
  else
    echo "ERROR: ROLLBACK restarted but did NOT become healthy. Manual intervention required NOW."
    systemctl status "$SERVICE" --no-pager || true
    journalctl -u "$SERVICE" -n 100 --no-pager || true
    return 1
  fi
}

# --- Atomic swap.
PENDING_LINK="${RELEASES_DIR}/.pending-current"
ln -sfn "$NEW_RELEASE_API_DIR" "$PENDING_LINK"
mv -T "$PENDING_LINK" "$LIVE_DIR"
echo "${LIVE_DIR} now points at ${NEW_RELEASE_API_DIR}."

NEW_VERSION="$(tr -d '[:space:]' < "${NEW_RELEASE_DIR}/VERSION" 2>/dev/null || echo "unknown")"

# --- Covers BOTH post-swap failure modes: a restart that fails outright,
# and a restart that "succeeds" but never becomes healthy. Both call the
# exact same rollback path.
if ! systemctl restart "$SERVICE"; then
  echo "ERROR: systemctl restart failed for the new release."
  restore_previous_release_and_env || true
  exit 1
fi

if ! poll_health "$APP_PORT" "$NEW_VERSION" "${RAD_HEALTH_TIMEOUT_SECONDS:-180}"; then
  echo "ERROR: new release (${NEW_RELEASE_API_DIR}, version ${NEW_VERSION}) did not become healthy within the timeout."
  systemctl status "$SERVICE" --no-pager || true
  journalctl -u "$SERVICE" -n 100 --no-pager || true
  restore_previous_release_and_env
  exit 1
fi

PORT_OWNERS="$(ss -ltnp 2>/dev/null | grep ":${APP_PORT} " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)"
PORT_OWNER_COUNT="$(echo "$PORT_OWNERS" | grep -c . || true)"
if [[ "$PORT_OWNER_COUNT" != "1" ]]; then
  echo "WARNING: expected exactly one process bound to port ${APP_PORT}, found: ${PORT_OWNERS:-none}. The health check passed, so this deploy is NOT being rolled back automatically for this alone, but investigate: ss -ltnp | grep ':${APP_PORT}'"
fi

echo "Deploy succeeded. ${LIVE_DIR} -> ${NEW_RELEASE_API_DIR} (commit ${COMMIT_SHA}, version ${NEW_VERSION}), ${SERVICE} healthy."

echo "Pruning old artifact releases beyond the last ${KEEP_RELEASES} (current, and anything named '*-bootstrap', are always kept)..."
# shellcheck disable=SC2012
{
  ls -1dt "${RELEASES_DIR}"/release-*/ 2>/dev/null \
    | grep -v "^$(readlink -f "$NEW_RELEASE_DIR")/\$" \
    | tail -n "+$(( KEEP_RELEASES + 1 ))" \
    | while read -r old; do
        echo "  removing old release: ${old}"
        rm -rf "${old%/}"
      done
} || true

echo "Remote artifact deploy of RAD API commit ${COMMIT_SHA} (version ${NEW_VERSION}) complete."
