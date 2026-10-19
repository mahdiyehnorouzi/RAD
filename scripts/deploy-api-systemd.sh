#!/usr/bin/env bash
#
# Release a PINNED, explicit commit of the API via the real production
# topology: systemd-managed rad-api.service at /opt/rad/apps/api, with
# isolated/versioned builds under /opt/rad-releases and an atomic
# symlink swap. See scripts/lib/deploy-api-remote.sh for the actual
# mechanics. Requires scripts/bootstrap-api-release-layout.sh to have
# already been run once on the target host.
#
# This NEVER deploys "whatever main currently is" - you must pass the
# exact commit SHA to release, and the remote script verifies the
# checkout actually landed on it before building or touching anything.
#
# Usage: RAD_API_COMMIT=<sha> scripts/deploy-api-systemd.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_LIVE_DIR="${RAD_API_LIVE_DIR:-/opt/rad/apps/api}"
RAD_API_RELEASES_DIR="${RAD_API_RELEASES_DIR:-/opt/rad-releases}"
RAD_API_SERVICE="${RAD_API_SERVICE:-rad-api.service}"
RAD_API_PORT="${RAD_API_PORT:-4000}"
RAD_API_ENV_FILE="${RAD_API_ENV_FILE:-/etc/rad/api.env}"
RAD_API_GIT_URL="${RAD_API_GIT_URL:-https://github.com/mahdiyehnorouzi/RAD.git}"
RAD_API_KEEP_RELEASES="${RAD_API_KEEP_RELEASES:-5}"
RAD_API_COMMIT="${RAD_API_COMMIT:-}"

if [[ -z "$RAD_API_COMMIT" ]]; then
  echo "ERROR: RAD_API_COMMIT is required (the exact commit SHA to release). This script never defaults to 'main' HEAD at clone time."
  echo "Usage: RAD_API_COMMIT=<sha> $0"
  exit 1
fi

SSH_TARGET="${RAD_API_USER}@${RAD_API_HOST}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

if ! command -v ssh >/dev/null 2>&1; then
  echo "ssh not found on this machine."
  exit 1
fi

if ! ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'true' 2>/tmp/rad-ssh-preflight.$$; then
  echo "Non-interactive SSH authentication to ${SSH_TARGET} failed."
  cat /tmp/rad-ssh-preflight.$$ 2>/dev/null || true
  rm -f /tmp/rad-ssh-preflight.$$
  exit 1
fi
rm -f /tmp/rad-ssh-preflight.$$

echo "Deploying RAD API commit ${RAD_API_COMMIT} to ${SSH_TARGET}:${RAD_API_LIVE_DIR} via ${RAD_API_SERVICE}..."

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- \
  "$RAD_API_LIVE_DIR" "$RAD_API_RELEASES_DIR" "$RAD_API_SERVICE" "$RAD_API_PORT" \
  "$RAD_API_ENV_FILE" "$RAD_API_GIT_URL" "$RAD_API_COMMIT" "$RAD_API_KEEP_RELEASES" \
  < "${ROOT}/scripts/lib/deploy-api-remote.sh"

echo "Remote API deploy step finished for ${SSH_TARGET}."
