#!/usr/bin/env bash
#
# Root-owned SSH forced command for the `rad-deploy` account. Installed at
# a fixed path, owned by root, group-readable+executable (not writable) by
# `rad-deploy`, and referenced from authorized_keys as:
#
#   restrict,command="/usr/local/libexec/rad-deploy-ssh-entrypoint.sh" \
#   ssh-ed25519 AAAA... github-actions-rad-deploy
#
# `command=` makes OpenSSH run ONLY this script for every session opened
# with that key, no matter what the client asked for - the client's
# requested command is still available in $SSH_ORIGINAL_COMMAND, which this
# script treats as untrusted input and validates against a fixed grammar
# before using any part of it. Combined with `restrict` (no pty, no
# port/agent/X11 forwarding, no ~/.ssh/rc), and with rad-deploy's login
# shell being the dedicated restricted shell
# (rad-deploy-shell.sh, installed as rad-deploy's shell in /etc/passwd),
# there is no mode in which this account can run an arbitrary remote
# command or get an interactive shell.
#
# Protocol (one SSH session = one release attempt):
#   client runs:  ssh rad-deploy@<host> "deploy kind=<api|frontend> commit=<40-hex> run_id=<int> run_attempt=<int>"
#                 with a tar stream of exactly { release.json, release.sigstore.json[, api-release.tar.gz] }
#                 piped to that session's stdin.
#   this script:  validates SSH_ORIGINAL_COMMAND, reads a SIZE-BOUNDED copy of stdin to a temp
#                 file, hands it to scripts/production/rad_deploy_entrypoint.py for member-by-member
#                 validation (type/name/size/count - no traversal, no symlinks/hardlinks, no
#                 special files, no duplicates, no unexpected entries) and extraction into a fresh
#                 /var/lib/rad-release/incoming/release-* staging directory (the same convention
#                 scripts/production/rad_release.py already expects), builds the exact JSON request
#                 the broker requires, and pipes it to `sudo -n /usr/local/sbin/rad-release` (no
#                 arguments - see the note on the sudoers rule below). The broker's own
#                 stdout/stderr and exit code are what the GitHub Actions step sees - this script
#                 adds no privileged logic of its own and makes no release decision; the broker
#                 (already reviewed, unchanged) does that.
#
# Compatibility note on the sudoers rule: rad-deploy.sudoers grants
# `rad-deploy ALL=(root) NOPASSWD: /usr/local/sbin/rad-release ""`. The
# trailing `""` in that FILE is sudoers' own special syntax meaning "this
# command must be invoked with EXACTLY ZERO arguments" - it is not a literal
# argument to pass on an actual command line. The invocation below is
# therefore `sudo -n "$BROKER"` with NO trailing empty-string argument,
# which is what rad_release.py's own `len(sys.argv) == 1` check and the
# sudoers zero-argument rule both actually require. Passing a literal `""`
# argument here (bash would turn it into a real, if empty, extra argv
# entry) would make sys.argv length 2 and the sudoers match AND the
# broker's own argument-count check would both reject every single release
# attempt.
set -euo pipefail

INCOMING_BASE="${RAD_DEPLOY_INCOMING_BASE:-/var/lib/rad-release/incoming}"
BROKER="${RAD_DEPLOY_BROKER:-/usr/local/sbin/rad-release}"
VALIDATOR="${RAD_DEPLOY_VALIDATOR:-/usr/local/libexec/rad_deploy_entrypoint.py}"
# ~2 GiB (the broker's own api-release.tar.gz cap) plus headroom for tar
# block padding and the two small manifest files alongside it.
MAX_TRANSPORT_BYTES="${RAD_DEPLOY_MAX_TRANSPORT_BYTES:-2200000000}"

fail() {
  echo "rad-deploy-ssh-entrypoint: $1" >&2
  exit 1
}

[[ -n "${SSH_ORIGINAL_COMMAND:-}" ]] || fail "no command given (interactive access is not permitted for this key)"

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

WORKDIR="$(mktemp -d)"
STAGE_DIR="$(mktemp -d "${INCOMING_BASE}/release-XXXXXXXXXXXX")"
cleanup() { rm -rf -- "$WORKDIR" "$STAGE_DIR"; }
trap cleanup EXIT

# Bounded read: write at most MAX_TRANSPORT_BYTES+1 bytes so we can tell
# "exactly at the cap" apart from "truncated because it was larger" without
# ever buffering an unbounded upload in memory or on disk.
UPLOAD_TAR="${WORKDIR}/upload.tar"
head -c "$(( MAX_TRANSPORT_BYTES + 1 ))" > "$UPLOAD_TAR"
UPLOAD_SIZE="$(wc -c < "$UPLOAD_TAR" | tr -d '[:space:]')"
[[ "$UPLOAD_SIZE" -gt 0 ]] || fail "empty upload"
[[ "$UPLOAD_SIZE" -le "$MAX_TRANSPORT_BYTES" ]] || fail "upload exceeds ${MAX_TRANSPORT_BYTES} bytes"

# Member-by-member validation and extraction - see
# scripts/production/rad_deploy_entrypoint.py. Fails closed on anything
# other than the exact expected flat file set: no traversal, no symlinks or
# hard links, no special files, no duplicates, no unexpected or oversized
# entries. Nothing is extracted at all unless every member passes.
python3 "$VALIDATOR" --tar-path "$UPLOAD_TAR" --stage-dir "$STAGE_DIR" --kind "$KIND"

STAGE_NAME="$(basename "$STAGE_DIR")"

# Only fixed-format data crosses the privilege boundary: stage directory
# name (already matched against the broker's own STAGE regex by virtue of
# coming from this exact mktemp template), release kind, commit, and run
# identity - all already validated against the fixed grammar above. The
# broker (scripts/production/rad_release.py, unchanged, already reviewed)
# does every privileged thing from here: re-verifies the signed manifest
# against this exact commit/run identity, checks the production activation
# policy, performs the atomic release, health-checks it, and rolls back on
# failure. This script never touches /opt/rad*, systemd, or Docker
# directly, and passes the request body over stdin only - never as a
# command-line argument.
python3 - <<PY_REQUEST | sudo -n "$BROKER"
import json
print(json.dumps({
    "stage": "${STAGE_NAME}",
    "kind": "${KIND}",
    "commit": "${COMMIT}",
    "run_id": int("${RUN_ID}"),
    "run_attempt": int("${RUN_ATTEMPT}"),
}))
PY_REQUEST
