#!/usr/bin/env bash
#
# ONE-TIME, idempotent bootstrap: migrates the real production /opt/rad/apps/api
# (a prebuilt directory — no .git, no VERSION file) into a releases+symlink
# layout, and externalizes rad-api.service's EnvironmentFile out of the
# release tree. Required once, before scripts/deploy-api-systemd.sh can be
# used at all (that script refuses to run against a plain, non-symlinked
# LIVE_DIR). See scripts/lib/bootstrap-api-remote.sh for the actual steps,
# and docs/opt-rad-release-bootstrap.md for the full narrative/why.
#
# Safe to re-run: if the layout is already bootstrapped, this is a no-op.
# Requires interactive confirmation on the target host before changing
# anything (see the remote script's own confirmation prompt) — this
# wrapper does not pre-approve that for you.
#
# Usage: scripts/bootstrap-api-release-layout.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RAD_API_HOST="${RAD_API_HOST:-46.34.163.16}"
RAD_API_USER="${RAD_API_USER:-root}"
RAD_API_LIVE_DIR="${RAD_API_LIVE_DIR:-/opt/rad/apps/api}"
RAD_API_RELEASES_DIR="${RAD_API_RELEASES_DIR:-/opt/rad-releases}"
RAD_API_SERVICE="${RAD_API_SERVICE:-rad-api.service}"
RAD_API_PORT="${RAD_API_PORT:-4000}"
RAD_API_ENV_FILE="${RAD_API_ENV_FILE:-/etc/rad/api.env}"

SSH_TARGET="${RAD_API_USER}@${RAD_API_HOST}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

echo "Bootstrapping release layout on ${SSH_TARGET} for ${RAD_API_LIVE_DIR} (${RAD_API_SERVICE})..."
echo "This is a ONE-TIME, production-structural change (moves the live prebuilt directory into a releases layout and repoints the service's EnvironmentFile). It is NOT reversed automatically if you approve it here and it then fails partway through steps 3-4 (the move + symlink) rather than step 5 (which the remote script does revert on its own) — see scripts/lib/bootstrap-api-remote.sh's plan output below for exactly what will happen before you confirm."

if ! ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'true' 2>/tmp/rad-ssh-preflight.$$; then
  echo "Non-interactive SSH authentication to ${SSH_TARGET} failed."
  cat /tmp/rad-ssh-preflight.$$ 2>/dev/null || true
  rm -f /tmp/rad-ssh-preflight.$$
  exit 1
fi
rm -f /tmp/rad-ssh-preflight.$$

echo "--- Running preflight + plan (read-only, changes nothing) ---"
if ! ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- \
  "$RAD_API_LIVE_DIR" "$RAD_API_RELEASES_DIR" "$RAD_API_SERVICE" "$RAD_API_PORT" "$RAD_API_ENV_FILE" "plan" \
  < "${ROOT}/scripts/lib/bootstrap-api-remote.sh"; then
  echo "Preflight failed or bootstrap is not applicable (see output above). Nothing was changed. Exiting."
  exit 1
fi

echo
# The remote script's own confirmation prompt can't read from a real
# terminal when its source is piped over stdin to `bash -s` (stdin IS the
# script source in that mode) - so this wrapper, not the remote script,
# is where the interactive approval actually happens, AFTER the plan
# above has been shown; the remote script is then told (via "execute")
# that approval was already given right here.
read -r -p "Type 'bootstrap' to continue: " CONFIRM
if [[ "$CONFIRM" != "bootstrap" ]]; then
  echo "Aborted. Nothing was changed."
  exit 1
fi

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s -- \
  "$RAD_API_LIVE_DIR" "$RAD_API_RELEASES_DIR" "$RAD_API_SERVICE" "$RAD_API_PORT" "$RAD_API_ENV_FILE" "execute" \
  < "${ROOT}/scripts/lib/bootstrap-api-remote.sh"

echo "Bootstrap step finished for ${SSH_TARGET}."
