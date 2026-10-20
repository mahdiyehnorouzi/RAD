#!/usr/bin/env bash
#
# Narrowly-scoped privileged wrapper, installed at /usr/local/bin/rad-release-api.sh
# on the production VPS, owned by root, mode 0750 (root:rad-runner), and
# invoked ONLY via the sudoers rule in rad-runner.sudoers:
#
#   rad-runner ALL=(root) NOPASSWD: /usr/local/bin/rad-release-api.sh
#
# Security boundary this script exists to enforce: the unprivileged
# `rad-runner` account (the GitHub Actions self-hosted runner service
# user) must be able to trigger exactly one privileged operation --
# "extract this already-built, already-verified artifact and restart
# rad-api.service" -- and nothing else. It must NOT be able to run
# arbitrary commands as root, touch the Docker socket, or pass through
# attacker-influenced paths/hosts/ports. All of the following are
# therefore hardcoded here, NOT accepted as arguments or environment
# variables from the caller:
#   - the live/releases/env-file paths
#   - the systemd unit name
#   - the application port
# The only two values accepted from the caller are the artifact path and
# the commit SHA, and both are strictly validated before use (the
# artifact must already live under the fixed staging directory that only
# root/rad-runner's own prior upload step can write to; the commit SHA
# must look like a real git SHA). This script never reads $PATH-relative
# commands and never evaluates caller-supplied strings.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: must run as root (invoke via sudo)." >&2
  exit 1
fi

# --- Fixed, non-overridable production topology. Keep these in sync with
# docs/cicd-pipeline.md and the values the old SSH-based workflow defaulted
# to (RAD_API_HOST/RAD_API_USER no longer apply at all -- this runs locally
# on the host, there is no SSH hop left to configure).
readonly LIVE_DIR="/opt/rad/apps/api"
readonly RELEASES_DIR="/opt/rad-releases"
readonly SERVICE="rad-api.service"
readonly APP_PORT="4000"
readonly ENV_FILE_TARGET="/etc/rad/api.env"
readonly KEEP_RELEASES="5"
# Only artifacts already staged here (by the runner's own unprivileged
# download step, see deploy-api-vps.yml) are ever eligible -- this directory
# is owned by rad-runner and is NOT writable by other unprivileged users,
# so this wrapper only ever extracts something the CI job itself placed.
readonly STAGING_DIR="/opt/rad-releases/.incoming"

ARTIFACT_PATH="${1:-}"
COMMIT_SHA="${2:-}"

if [[ -z "$ARTIFACT_PATH" || -z "$COMMIT_SHA" ]]; then
  echo "Usage: rad-release-api.sh <artifact-tar-gz-under-${STAGING_DIR}> <commit-sha>" >&2
  exit 1
fi

# Reject anything outside the fixed staging directory (blocks path
# traversal / symlink tricks / arbitrary-file-extraction attempts).
REAL_ARTIFACT_PATH="$(readlink -f -- "$ARTIFACT_PATH" 2>/dev/null || true)"
REAL_STAGING_DIR="$(readlink -f -- "$STAGING_DIR" 2>/dev/null || true)"
if [[ -z "$REAL_ARTIFACT_PATH" || -z "$REAL_STAGING_DIR" || "$REAL_ARTIFACT_PATH" != "$REAL_STAGING_DIR"/* ]]; then
  echo "ERROR: artifact path must resolve to a file under ${STAGING_DIR}, got '${ARTIFACT_PATH}'." >&2
  exit 1
fi
if [[ ! -f "$REAL_ARTIFACT_PATH" ]]; then
  echo "ERROR: ${REAL_ARTIFACT_PATH} does not exist." >&2
  exit 1
fi

if ! [[ "$COMMIT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: commit sha must be exactly 40 lowercase hex characters, got '${COMMIT_SHA}'." >&2
  exit 1
fi

# The actual release mechanics (atomic symlink swap, env-file guard checks,
# health poll, automatic rollback) are unchanged from before this migration
# -- see scripts/lib/deploy-api-remote-artifact.sh, reused verbatim here.
exec /opt/rad-releases/.bin/deploy-api-remote-artifact.sh \
  "$LIVE_DIR" "$RELEASES_DIR" "$SERVICE" "$APP_PORT" \
  "$ENV_FILE_TARGET" "$REAL_ARTIFACT_PATH" "$COMMIT_SHA" "$KEEP_RELEASES"
