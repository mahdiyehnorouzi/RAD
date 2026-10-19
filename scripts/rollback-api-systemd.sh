#!/usr/bin/env bash
#
# Manual rollback for the systemd-managed API release (see
# scripts/deploy-api-systemd.sh, which already auto-rolls-back on its own
# failed health check). Use this for rolling back LATER, or further back
# than the single previous release the manifest records.
#
# Restores BOTH the release symlink AND the matching pre-deploy env
# snapshot - see scripts/lib/rollback-api-remote.sh's header for why
# restoring code without the matching env is unsafe.
#
# Database compatibility: this script NEVER touches the database. If the
# release you're rolling back past introduced a schema change and there
# is no migration tooling to revert it (there currently is none in this
# repo - see docs/db-schema-compatibility-v1.3.0.md), rolling back code
# alone can leave the database and the restored code out of sync. STOP
# and get explicit sign-off on the database plan before running this in
# that situation.
#
# Usage: scripts/rollback-api-systemd.sh [release-dir-name] [env-snapshot-path]
#   With no arguments, rolls back to the release + env snapshot recorded
#   in $RAD_API_RELEASES_DIR/.rollback-manifest.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_LIVE_DIR="${RAD_API_LIVE_DIR:-/opt/rad/apps/api}"
RAD_API_RELEASES_DIR="${RAD_API_RELEASES_DIR:-/opt/rad-releases}"
RAD_API_SERVICE="${RAD_API_SERVICE:-rad-api.service}"
RAD_API_PORT="${RAD_API_PORT:-4000}"
RAD_API_ENV_FILE="${RAD_API_ENV_FILE:-/etc/rad/api.env}"
TARGET_RELEASE_NAME="${1:-}"
TARGET_ENV_SNAPSHOT="${2:-}"

SSH_TARGET="${RAD_API_USER}@${RAD_API_HOST}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

echo "Rolling back RAD API on ${SSH_TARGET} (service ${RAD_API_SERVICE})."
echo "This restarts ${RAD_API_SERVICE} against an older, already-built release and restores its matching env snapshot. The database is NOT touched by this script."
read -r -p "Type 'rollback' to continue: " CONFIRM
if [[ "$CONFIRM" != "rollback" ]]; then
  echo "Aborted."
  exit 1
fi

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- \
  "$RAD_API_LIVE_DIR" "$RAD_API_RELEASES_DIR" "$RAD_API_SERVICE" "$RAD_API_PORT" \
  "$RAD_API_ENV_FILE" "$TARGET_RELEASE_NAME" "$TARGET_ENV_SNAPSHOT" \
  < "${ROOT}/scripts/lib/rollback-api-remote.sh"

echo "Remote rollback step finished for ${SSH_TARGET}."
