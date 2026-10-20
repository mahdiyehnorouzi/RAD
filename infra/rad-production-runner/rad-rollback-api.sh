#!/usr/bin/env bash
#
# Narrowly-scoped privileged wrapper, installed at /usr/local/bin/rad-rollback-api.sh
# on the production VPS, owned by root, mode 0750 (root:rad-runner), invoked
# ONLY via:
#   rad-runner ALL=(root) NOPASSWD: /usr/local/bin/rad-rollback-api.sh
#
# Takes NO arguments -- it always restores exactly whatever
# /opt/rad-releases/.rollback-manifest.json recorded as "the release that
# was live immediately before the most recent deploy". This is the same
# post-smoke-test-failure rollback the old SSH-based workflow ran
# non-interactively over a remote shell; the only thing this migration
# changes is that it now runs locally as a sudo-invoked root command
# instead of over an inbound SSH session.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: must run as root (invoke via sudo)." >&2
  exit 1
fi

readonly LIVE_DIR="/opt/rad/apps/api"
readonly RELEASES_DIR="/opt/rad-releases"
readonly SERVICE="rad-api.service"
readonly APP_PORT="4000"
readonly ENV_FILE_TARGET="/etc/rad/api.env"

exec /opt/rad-releases/.bin/rollback-api-remote.sh \
  "$LIVE_DIR" "$RELEASES_DIR" "$SERVICE" "$APP_PORT" \
  "$ENV_FILE_TARGET" "" ""
