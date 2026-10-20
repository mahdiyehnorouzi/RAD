#!/usr/bin/env bash
#
# Root-owned SSH forced command for the `rad-deploy` account. Installed at a
# fixed path and referenced from authorized_keys as:
#
#   command="/usr/local/libexec/rad-deploy-ssh-entrypoint.sh",no-pty,\
#   no-agent-forwarding,no-X11-forwarding,no-port-forwarding,no-user-rc,\
#   restrict ssh-ed25519 AAAA... github-actions-rad-deploy
#
# `command=` makes OpenSSH run ONLY this script for every session opened with
# that key, no matter what the client asked for — the client's requested
# command is still available in $SSH_ORIGINAL_COMMAND, which this script
# treats as untrusted input and validates against a fixed grammar before
# using any part of it. There is no interactive shell, no port/agent/X11
# forwarding, and no other command this key can ever run on this host.
#
# Protocol (one SSH session = one release attempt):
#   client runs:  ssh rad-deploy@<host> "deploy kind=<api|frontend> commit=<40-hex> run_id=<int> run_attempt=<int>"
#                 with a tar stream of exactly { release.json, release.sigstore.json[, api-release.tar.gz] }
#                 piped to that session's stdin.
#   this script:  validates SSH_ORIGINAL_COMMAND, extracts the tar stream into a fresh
#                 /var/lib/rad-release/incoming/release-* staging directory (the same
#                 convention scripts/production/rad_release.py already expects), builds the
#                 exact JSON request the broker requires, and pipes it to
#                 `sudo -n /usr/local/sbin/rad-release ""`. The broker's own stdout/stderr and
#                 exit code are what the GitHub Actions step sees — this script adds no
#                 privileged logic of its own and makes no decision about whether the
#                 release is allowed; scripts/production/rad_release.py (already reviewed,
#                 unchanged) does that.
#
# This file must be root-owned, mode 0750 or tighter, and NOT writable by the
# rad-deploy user — rad-deploy must not be able to alter the one command it is
# allowed to trigger.
set -euo pipefail

INCOMING_BASE="/var/lib/rad-release/incoming"
BROKER="/usr/local/sbin/rad-release"

fail() {
  echo "rad-deploy-ssh-entrypoint: $1" >&2
  exit 1
}

[[ -n "${SSH_ORIGINAL_COMMAND:-}" ]] || fail "no command given (interactive shell access is not permitted for this key)"

# Fixed grammar only: "deploy kind=(api|frontend) commit=<40 hex> run_id=<int> run_attempt=<int>".
# Anything else - extra words, shell metacharacters, a different verb - is rejected outright.
if [[ "$SSH_ORIGINAL_COMMAND" =~ ^deploy\ kind=(api|frontend)\ commit=([0-9a-f]{40})\ run_id=([0-9]{1,18})\ run_attempt=([0-9]{1,18})$ ]]; then
  KIND="${BASH_REMATCH[1]}"
  COMMIT="${BASH_REMATCH[2]}"
  RUN_ID="${BASH_REMATCH[3]}"
  RUN_ATTEMPT="${BASH_REMATCH[4]}"
else
  fail "rejected command (does not match the fixed 'deploy kind=... commit=... run_id=... run_attempt=...' grammar)"
fi

STAGE_DIR="$(mktemp -d "${INCOMING_BASE}/release-XXXXXXXXXXXX")"
cleanup() { rm -rf -- "$STAGE_DIR"; }
trap cleanup EXIT

# Extract ONLY the fixed, known-flat file set this session's stdin is expected to carry.
# --no-same-owner/--no-same-permissions: never trust the sender's uid/mode bits.
# No subdirectories or symlinks are expected; anything else found is treated as tampering.
tar -xf - -C "$STAGE_DIR" --no-same-owner --no-same-permissions

for entry in "$STAGE_DIR"/*; do
  name="$(basename "$entry")"
  [[ -f "$entry" && ! -L "$entry" ]] || fail "unexpected non-regular entry in upload: ${name}"
  case "$name" in
    release.json|release.sigstore.json) ;;
    api-release.tar.gz) [[ "$KIND" == "api" ]] || fail "api-release.tar.gz not expected for kind=${KIND}" ;;
    *) fail "unexpected file in upload: ${name}" ;;
  esac
done
[[ -f "${STAGE_DIR}/release.json" ]] || fail "release.json missing from upload"
[[ -f "${STAGE_DIR}/release.sigstore.json" ]] || fail "release.sigstore.json missing from upload"
if [[ "$KIND" == "api" ]]; then
  [[ -f "${STAGE_DIR}/api-release.tar.gz" ]] || fail "api-release.tar.gz missing from upload (required for kind=api)"
fi

STAGE_NAME="$(basename "$STAGE_DIR")"

# The broker (scripts/production/rad_release.py, unchanged, already reviewed) does every
# privileged thing from here: re-verifies the signed manifest against the exact commit/run
# identity below, checks the production activation policy, performs the atomic release,
# health-checks it, and rolls back on failure. This script never touches /opt/rad*, systemd,
# or Docker directly, and passes the request body over stdin only - never as an argument.
python3 - <<PY_REQUEST | sudo -n "$BROKER" ""
import json
print(json.dumps({
    "stage": "${STAGE_NAME}",
    "kind": "${KIND}",
    "commit": "${COMMIT}",
    "run_id": int("${RUN_ID}"),
    "run_attempt": int("${RUN_ATTEMPT}"),
}))
PY_REQUEST
