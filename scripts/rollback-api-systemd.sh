#!/usr/bin/env bash
#
# Manual rollback for the systemd-managed API release (see
# scripts/deploy-api-systemd.sh). The deploy script already rolls back
# automatically when its own health check fails — this script is for
# rolling back LATER, after a deploy that looked healthy at the time but
# turned out to be bad (a regression found after the fact), or for rolling
# back further than the single previous release the manifest records.
#
# Restores the LIVE_DIR symlink to a previous release directory that still
# exists on disk under RELEASES_DIR, restarts the service, and verifies
# health. Never rebuilds anything — if the target release directory was
# already pruned, pass RAD_API_RELEASES_DIR releases explicitly or rebuild
# it by re-running scripts/deploy-api-systemd.sh against the desired commit.
#
# Database compatibility: this script NEVER touches the database. It is
# a code+config rollback only. If the release being rolled back TO expects
# an OLDER database schema than what migrations since then have applied,
# rolling back code without also reverting those migrations can break it —
# this script deliberately does not attempt that (no automatic migration
# rollback exists in this repo, and running one without review is exactly
# the kind of destructive action this task forbids without approval). If
# the release you're rolling back past introduced a schema change, STOP and
# get explicit sign-off on the database plan before running this.
#
# Usage: scripts/rollback-api-systemd.sh [release-dir-name]
#   With no argument, rolls back to the release recorded in
#   $RAD_API_RELEASES_DIR/.rollback-manifest.json (the one running
#   immediately before the most recent deploy-api-systemd.sh run).
#   Pass a release directory NAME (not full path), e.g.
#   "1.5.0-20261019T120000Z", to roll back to a specific other release
#   still present under RELEASES_DIR.
set -euo pipefail

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_LIVE_DIR="${RAD_API_LIVE_DIR:-/opt/rad}"
RAD_API_RELEASES_DIR="${RAD_API_RELEASES_DIR:-/opt/rad-releases}"
RAD_API_SERVICE="${RAD_API_SERVICE:-rad-api.service}"
RAD_API_PORT="${RAD_API_PORT:-4000}"
TARGET_RELEASE_NAME="${1:-}"

SSH_TARGET="${RAD_API_USER}@${RAD_API_HOST}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

echo "Rolling back RAD API on ${SSH_TARGET} (service ${RAD_API_SERVICE})."
echo "This will restart ${RAD_API_SERVICE} against an older, already-built release. The database is NOT touched by this script."
read -r -p "Type 'rollback' to continue: " CONFIRM
if [[ "$CONFIRM" != "rollback" ]]; then
  echo "Aborted."
  exit 1
fi

# shellcheck disable=SC2087
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- \
  "$RAD_API_LIVE_DIR" "$RAD_API_RELEASES_DIR" "$RAD_API_SERVICE" "$RAD_API_PORT" "$TARGET_RELEASE_NAME" \
  <<'REMOTE_SCRIPT'
set -euo pipefail

LIVE_DIR="$1"
RELEASES_DIR="$2"
SERVICE="$3"
APP_PORT="$4"
TARGET_RELEASE_NAME="$5"

MANIFEST="${RELEASES_DIR}/.rollback-manifest.json"
if [[ -n "$TARGET_RELEASE_NAME" ]]; then
  TARGET_RELEASE="${RELEASES_DIR}/${TARGET_RELEASE_NAME}"
else
  if [[ ! -f "$MANIFEST" ]]; then
    echo "ERROR: no release given and no ${MANIFEST} found. Pass a release directory name explicitly (one listed under ${RELEASES_DIR})."
    exit 1
  fi
  TARGET_RELEASE="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).releaseDir)" "$MANIFEST")"
  echo "No release given; using the one recorded before the most recent deploy:"
  node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')), null, 2))" "$MANIFEST"
fi

if [[ ! -d "$TARGET_RELEASE" ]]; then
  echo "ERROR: ${TARGET_RELEASE} does not exist on disk. List available releases with: ls -1 ${RELEASES_DIR}"
  exit 1
fi
if [[ ! -f "${TARGET_RELEASE}/apps/api/dist/main.js" ]]; then
  echo "ERROR: ${TARGET_RELEASE} does not look like a built release (apps/api/dist/main.js missing). Rebuild it with scripts/deploy-api-systemd.sh targeting that commit instead of rolling back to an unbuilt directory."
  exit 1
fi

CURRENT_RELEASE="$(readlink -f "$LIVE_DIR" 2>/dev/null || echo "")"
if [[ "$CURRENT_RELEASE" == "$TARGET_RELEASE" ]]; then
  echo "NOTICE: ${LIVE_DIR} already points at ${TARGET_RELEASE} — nothing to change. Restarting the service anyway in case it's unhealthy for an unrelated reason."
fi

PENDING_LINK="${RELEASES_DIR}/.pending-current"
ln -sfn "$TARGET_RELEASE" "$PENDING_LINK"
mv -T "$PENDING_LINK" "$LIVE_DIR"
echo "${LIVE_DIR} now points at ${TARGET_RELEASE}."

echo "Restarting ${SERVICE}..."
systemctl restart "$SERVICE"

ROLLED_BACK_VERSION="$(tr -d '[:space:]' < "${TARGET_RELEASE}/VERSION" 2>/dev/null || echo unknown)"
echo "Polling local API health on 127.0.0.1:${APP_PORT} (expecting version ${ROLLED_BACK_VERSION})..."
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
  systemctl status "$SERVICE" --no-pager || true
  journalctl -u "$SERVICE" -n 100 --no-pager || true
  exit 1
fi

echo "Rollback to ${TARGET_RELEASE} (version ${ROLLED_BACK_VERSION}) complete. Database was not touched by this script."
REMOTE_SCRIPT

echo "Remote rollback step finished for ${SSH_TARGET}."
