#!/usr/bin/env bash
#
# Remote body of scripts/rollback-api-systemd.sh. For rolling back LATER
# (after a deploy that looked healthy but turned out bad), or further
# back than the single previous release the manifest records.
# scripts/deploy-api-systemd.sh already auto-rolls-back on its own
# failed health check - this is the manual path.
#
# Restores BOTH the release symlink and the env file from the matching
# pre-deploy snapshot (never just the code) - rolling back code alone
# while a newer env file (e.g. one with SEAWEEDFS_* added for a deploy
# now being undone) stays in place is exactly the "old code + new/
# incompatible config" state blocker #8 exists to prevent.
#
# Database compatibility: this script NEVER touches the database. See
# scripts/rollback-api-systemd.sh's own header for why.
set -euo pipefail

LIVE_DIR="$1"
RELEASES_DIR="$2"
SERVICE="$3"
APP_PORT="$4"
ENV_FILE_TARGET="$5"
TARGET_RELEASE_NAME="$6"   # a directory name under RELEASES_DIR, or empty to use the manifest
TARGET_ENV_SNAPSHOT="$7"   # a path under RELEASES_DIR/.env-snapshots, or empty to use the manifest's

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
    else
      rm -f "$body_file"
    fi
    sleep "$interval"
    elapsed=$(( elapsed + interval ))
  done
  [[ "$healthy" == "true" ]]
}

MANIFEST="${RELEASES_DIR}/.rollback-manifest.json"
if [[ -n "$TARGET_RELEASE_NAME" ]]; then
  TARGET_RELEASE="${RELEASES_DIR}/${TARGET_RELEASE_NAME}"
else
  if [[ ! -f "$MANIFEST" ]]; then
    echo "ERROR: no release given and no ${MANIFEST} found. Pass a release directory name explicitly."
    exit 1
  fi
  TARGET_RELEASE="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).releaseDir)" "$MANIFEST")"
  echo "No release given; using the one recorded before the most recent deploy:"
  node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')), null, 2))" "$MANIFEST"
fi

if [[ -z "$TARGET_ENV_SNAPSHOT" && -f "$MANIFEST" ]]; then
  MANIFEST_RELEASE="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).releaseDir)" "$MANIFEST" 2>/dev/null || echo "")"
  if [[ "$MANIFEST_RELEASE" == "$TARGET_RELEASE" ]]; then
    TARGET_ENV_SNAPSHOT="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).envSnapshot||'')" "$MANIFEST" 2>/dev/null || echo "")"
  fi
fi

if [[ ! -d "$TARGET_RELEASE" ]]; then
  echo "ERROR: ${TARGET_RELEASE} does not exist on disk. List available releases with: ls -1 ${RELEASES_DIR}"
  exit 1
fi
if [[ ! -f "${TARGET_RELEASE}/dist/main.js" ]]; then
  echo "ERROR: ${TARGET_RELEASE} does not look like a built release (dist/main.js missing)."
  exit 1
fi

if [[ -n "$TARGET_ENV_SNAPSHOT" ]]; then
  if [[ ! -f "$TARGET_ENV_SNAPSHOT" ]]; then
    echo "ERROR: env snapshot ${TARGET_ENV_SNAPSHOT} does not exist. Pass the correct snapshot path explicitly, or omit it to leave the CURRENT env file in place (not recommended if it was edited for a deploy you're now undoing)."
    exit 1
  fi
  echo "Restoring env file from snapshot: ${TARGET_ENV_SNAPSHOT}"
  install -m 600 "$TARGET_ENV_SNAPSHOT" "$ENV_FILE_TARGET"
else
  echo "WARNING: no matching env snapshot found/given - leaving ${ENV_FILE_TARGET} AS-IS. If it was changed for the deploy you're rolling back (e.g. new SEAWEEDFS_* keys the older code doesn't understand), that old code may now run against config it was never tested with. Check manually: ls ${RELEASES_DIR}/.env-snapshots/"
fi

PENDING_LINK="${RELEASES_DIR}/.pending-current"
ln -sfn "$TARGET_RELEASE" "$PENDING_LINK"
mv -T "$PENDING_LINK" "$LIVE_DIR"
echo "${LIVE_DIR} now points at ${TARGET_RELEASE}."

if ! systemctl restart "$SERVICE"; then
  echo "ERROR: systemctl restart failed. Manual intervention required NOW."
  systemctl status "$SERVICE" --no-pager || true
  exit 1
fi

ROLLED_BACK_VERSION="$( { tr -d '[:space:]' < "${TARGET_RELEASE}/VERSION"; } 2>/dev/null || echo "")"
if poll_health "$APP_PORT" "$ROLLED_BACK_VERSION" "${RAD_HEALTH_TIMEOUT_SECONDS:-180}"; then
  echo "Rollback to ${TARGET_RELEASE} (version ${ROLLED_BACK_VERSION}) complete. Database was not touched by this script."
else
  echo "ERROR: rolled-back API did not become healthy. Manual intervention required."
  systemctl status "$SERVICE" --no-pager || true
  journalctl -u "$SERVICE" -n 100 --no-pager || true
  exit 1
fi
