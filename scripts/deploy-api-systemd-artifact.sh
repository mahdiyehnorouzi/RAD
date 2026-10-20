#!/usr/bin/env bash
#
# Release a PRE-BUILT API artifact (produced by GitHub Actions — see
# .github/workflows/deploy-api-vps.yml's build-artifact job) to the real
# production topology: systemd-managed rad-api.service at
# /opt/rad/apps/api, isolated/versioned releases under /opt/rad-releases,
# atomic symlink swap. See scripts/lib/deploy-api-remote-artifact.sh for
# the actual mechanics this script just invokes over SSH.
#
# This is the ROUTINE release path — it never clones the repository or
# runs npm/build commands on the VPS. scripts/deploy-api-systemd.sh (the
# git-clone-and-build path) is kept as the emergency/disaster-recovery
# fallback for when a pre-built artifact genuinely isn't available.
#
# Usage: RAD_API_COMMIT=<sha> RAD_API_ARTIFACT_PATH=<local tarball path> scripts/deploy-api-systemd-artifact.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_LIVE_DIR="${RAD_API_LIVE_DIR:-/opt/rad/apps/api}"
RAD_API_RELEASES_DIR="${RAD_API_RELEASES_DIR:-/opt/rad-releases}"
RAD_API_SERVICE="${RAD_API_SERVICE:-rad-api.service}"
RAD_API_PORT="${RAD_API_PORT:-4000}"
RAD_API_ENV_FILE="${RAD_API_ENV_FILE:-/etc/rad/api.env}"
RAD_API_KEEP_RELEASES="${RAD_API_KEEP_RELEASES:-5}"
RAD_API_COMMIT="${RAD_API_COMMIT:-}"
RAD_API_ARTIFACT_PATH="${RAD_API_ARTIFACT_PATH:-}"

if [[ -z "$RAD_API_COMMIT" ]]; then
  echo "ERROR: RAD_API_COMMIT is required (the exact commit SHA this artifact was built from)."
  exit 1
fi
if [[ -z "$RAD_API_ARTIFACT_PATH" || ! -f "$RAD_API_ARTIFACT_PATH" ]]; then
  echo "ERROR: RAD_API_ARTIFACT_PATH must point at an existing local tarball to transfer (got '${RAD_API_ARTIFACT_PATH}')."
  exit 1
fi

SSH_TARGET="${RAD_API_USER}@${RAD_API_HOST}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)
REMOTE_STAGING_DIR="${RAD_API_RELEASES_DIR}/.incoming"
REMOTE_ARTIFACT_PATH="${REMOTE_STAGING_DIR}/release-${RAD_API_COMMIT:0:12}-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"

if ! command -v ssh >/dev/null 2>&1 || ! command -v scp >/dev/null 2>&1; then
  echo "ssh/scp not found on this machine."
  exit 1
fi

if ! ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'true' 2>/tmp/rad-ssh-preflight.$$; then
  echo "Non-interactive SSH authentication to ${SSH_TARGET} failed."
  cat /tmp/rad-ssh-preflight.$$ 2>/dev/null || true
  rm -f /tmp/rad-ssh-preflight.$$
  exit 1
fi
rm -f /tmp/rad-ssh-preflight.$$

echo "Transferring $(du -h "$RAD_API_ARTIFACT_PATH" | cut -f1) artifact to ${SSH_TARGET}:${REMOTE_ARTIFACT_PATH}..."
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "mkdir -p '${REMOTE_STAGING_DIR}'"
scp "${SSH_OPTS[@]}" "$RAD_API_ARTIFACT_PATH" "${SSH_TARGET}:${REMOTE_ARTIFACT_PATH}"

echo "Deploying RAD API commit ${RAD_API_COMMIT} to ${SSH_TARGET}:${RAD_API_LIVE_DIR} via ${RAD_API_SERVICE} (artifact path, no build on the VPS)..."
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- \
  "$RAD_API_LIVE_DIR" "$RAD_API_RELEASES_DIR" "$RAD_API_SERVICE" "$RAD_API_PORT" \
  "$RAD_API_ENV_FILE" "$REMOTE_ARTIFACT_PATH" "$RAD_API_COMMIT" "$RAD_API_KEEP_RELEASES" \
  < "${ROOT}/scripts/lib/deploy-api-remote-artifact.sh"

echo "Remote API artifact deploy step finished for ${SSH_TARGET}."
